<script lang="ts">
  import { drawBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

  let { theme = "auto" }: { theme?: "auto" | "light" | "dark" } = $props();
  const matchups: Matchup[] = [
    { sides: ["Aurora", "Harbour"], score: [2, 1] },
    { sides: ["Cascade", "Delta"], score: [0, 1] },
    { sides: ["Aurora", "Delta"], score: [3, 1] },
  ];
</script>

<div id="bracket">{@html drawBracket(matchups, { theme })}</div>
