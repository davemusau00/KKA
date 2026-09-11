import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@CurrentUser() user: RequestUser, @Query("q") q?: string) {
    if (!q) throw new BadRequestException("q is required");
    return this.searchService.search(user, q);
  }
}
