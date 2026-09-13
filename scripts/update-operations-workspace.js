const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/src/components/operations/OperationsWorkspace.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add icons and DTO imports
if (!content.includes('ProjectFinancialsDto')) {
  content = content.replace(
    "  XCircle,\r\n} from 'lucide-react';",
    "  XCircle,\r\n  TrendingUp,\r\n  AlertCircle,\r\n  CalendarClock,\r\n  Repeat,\r\n  ArrowUpRight,\r\n  PieChart,\r\n  DollarSign,\r\n} from 'lucide-react';"
  );
  content = content.replace(
    "  type VendorDto,\r\n} from '../../lib/api/operations.api';",
    "  type VendorDto,\r\n  type ProjectFinancialsDto,\r\n  type MeetingSeriesDto,\r\n} from '../../lib/api/operations.api';"
  );
}

// 2. Add states
const statesBlock = `  const [projects, setProjects] = useState<InternalProjectDto[]>([]);
  const [meetings, setMeetings] = useState<MeetingDto[]>([]);
  const [projectFinancials, setProjectFinancials] = useState<ProjectFinancialsDto | null>(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [meetingSeriesList, setMeetingSeriesList] = useState<MeetingSeriesDto[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [selectedByDays, setSelectedByDays] = useState<string[]>(['MO']);`;

if (!content.includes('projectFinancials,')) {
  content = content.replace(
    "  const [projects, setProjects] = useState<InternalProjectDto[]>([]);\r\n  const [meetings, setMeetings] = useState<MeetingDto[]>([]);",
    statesBlock
  );
}

// 3. Update load to fetch meetingSeries
if (!content.includes('operationsApi.meetingSeries()')) {
  content = content.replace(
    "operationsApi.assets(), operationsApi.projects(), operationsApi.meetings()",
    "operationsApi.assets(), operationsApi.projects(), operationsApi.meetings(), operationsApi.meetingSeries()"
  );
  content = content.replace(
    "[vendorRows, requisitionRows, categoryRows, orderRows, receiptRows, assetRows, projectRows, meetingRows]",
    "[vendorRows, requisitionRows, categoryRows, orderRows, receiptRows, assetRows, projectRows, meetingRows, seriesRows]"
  );
  content = content.replace(
    "setProjects(projectRows); setMeetings(meetingRows);",
    "setProjects(projectRows); setMeetings(meetingRows); setMeetingSeriesList(seriesRows || []);"
  );
  content = content.replace(
    "as [VendorDto[], PurchaseRequisitionDto[], PurchaseCategoryDto[], PurchaseOrderDto[], PurchaseReceiptDto[], AssetDto[], InternalProjectDto[], MeetingDto[]]",
    "as [VendorDto[], PurchaseRequisitionDto[], PurchaseCategoryDto[], PurchaseOrderDto[], PurchaseReceiptDto[], AssetDto[], InternalProjectDto[], MeetingDto[], MeetingSeriesDto[]]"
  );
}

// 4. Add useEffect to load projectFinancials on selectedProjectId change
const financialsEffect = `  useEffect(() => {
    if (!selectedProjectId) {
      setProjectFinancials(null);
      return;
    }
    let active = true;
    setLoadingFinancials(true);
    void operationsApi.projectFinancials(selectedProjectId)
      .then((data) => { if (active) setProjectFinancials(data); })
      .catch(() => { if (active) setProjectFinancials(null); })
      .finally(() => { if (active) setLoadingFinancials(false); });
    return () => { active = false; };
  }, [selectedProjectId]);
`;

if (!content.includes('operationsApi.projectFinancials(selectedProjectId)')) {
  content = content.replace(
    "  useEffect(() => { void loadHrRecords(selectedHrEmployeeId); }, [loadHrRecords, selectedHrEmployeeId]);",
    `  useEffect(() => { void loadHrRecords(selectedHrEmployeeId); }, [loadHrRecords, selectedHrEmployeeId]);\r\n\r\n${financialsEffect}`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated states and data loading in OperationsWorkspace.tsx');
