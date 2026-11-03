import { Component, inject, Input } from "@angular/core";
import { DomSanitizer, type SafeHtml } from "@angular/platform-browser";
import { drawBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];

@Component({
  selector: "app-bracket",
  standalone: true,
  template: `<div id="bracket" [innerHTML]="svg"></div>`,
})
export class BracketComponent {
  @Input() theme: "auto" | "light" | "dark" = "auto";

  private readonly sanitizer = inject(DomSanitizer);

  // The SVG is made here from your own data, and the package cleans every mark it is given: so it is trusted as it is.
  get svg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(drawBracket(matchups, { theme: this.theme }));
  }
}
