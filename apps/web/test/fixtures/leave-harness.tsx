import React from 'react';
import { createRoot } from 'react-dom/client';
import { LeaveRequestForm } from '../../src/components/operations/LeaveRequestForm';
import '../../src/index.css';

function Harness() {
  const [saved, setSaved] = React.useState(false);
  return <main className="mx-auto max-w-xl p-4"><LeaveRequestForm onSaved={async () => setSaved(true)} />{saved && <p role="status">Request saved</p>}</main>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
