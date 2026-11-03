<script setup lang="ts">
import { drawBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const props = withDefaults(defineProps<{ theme?: "auto" | "light" | "dark" }>(), { theme: "auto" });
const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];
</script>

<template>
  <div id="bracket" v-html="drawBracket(matchups, { theme: props.theme })"></div>
</template>
