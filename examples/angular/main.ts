import "@angular/compiler";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideZonelessChangeDetection } from "@angular/core";
import { BracketComponent } from "./bracket.component";

void bootstrapApplication(BracketComponent, { providers: [provideZonelessChangeDetection()] });
