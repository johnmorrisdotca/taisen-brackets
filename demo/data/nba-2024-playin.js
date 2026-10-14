// The six games of the 2024 NBA play-in tournament (April 16 to 19, 2024) and the seeds of the ten teams of each conference that played for the last two places, typed from
// English Wikipedia's article on the season, https://en.wikipedia.org/wiki/2023%E2%80%9324_NBA_season#Play-in_tournament, read on 2026-10-14, under CC BY-SA 4.0
// (https://creativecommons.org/licenses/by-sa/4.0/legalcode). Unlike the other files of this folder it was not read through spxn.com. This file is an adaptation of that
// and is shared under the same licence; the rest of this repository is MIT.
// `sides` are the franchise numbers of demo/data/nba-2024.js, or a three-letter code for a team that did not reach the playoffs; `seeds` are the seeds going into the play-in.
export const NBA_2024_PLAYIN = {
 "retrieved": "2026-10-14",
 "teams": [
  {"id":"CHI","name":"Chicago Bulls","abbr":"CHI","color":"#ce1141","group":"Eastern Conference","seed":9},
  {"id":"ATL","name":"Atlanta Hawks","abbr":"ATL","color":"#c1d32f","group":"Eastern Conference","seed":10},
  {"id":"SAC","name":"Sacramento Kings","abbr":"SAC","color":"#5a2d81","group":"Western Conference","seed":9},
  {"id":"GSW","name":"Golden State Warriors","abbr":"GSW","color":"#1d428a","group":"Western Conference","seed":10}
 ],
 "finalSeeds": {"1432":1,"1448":2,"1445":3,"1435":4,"1449":5,"1441":6,"1450":7,"1444":8,"1455":1,"1437":2,"1446":3,"1442":4,"1436":5,"1451":6,"1443":7,"1433":8},
 "games": [
  {"id":"east-78","sides":[1450,1444],"score":[105,104],"seeds":[7,8],"conference":"Eastern Conference"},
  {"id":"east-910","sides":["CHI","ATL"],"score":[131,116],"seeds":[9,10],"conference":"Eastern Conference"},
  {"id":"east-8","sides":[1444,"CHI"],"score":[112,91],"conference":"Eastern Conference","after":["east-78","east-910"]},
  {"id":"west-78","sides":[1433,1443],"score":[106,110],"seeds":[7,8],"conference":"Western Conference"},
  {"id":"west-910","sides":["SAC","GSW"],"score":[118,94],"seeds":[9,10],"conference":"Western Conference"},
  {"id":"west-8","sides":[1433,"SAC"],"score":[105,98],"conference":"Western Conference","after":["west-78","west-910"]}
 ]
};
