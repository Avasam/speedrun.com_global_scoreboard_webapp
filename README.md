# speedrun.com global scoreboard Webapp

The webapp version of an unofficial speedrun.com global scoreboard for competitive speedrunning  
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![Dependabot enabled](/assets/images/Dependabot-enabled.svg)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-dependabot-security-updates)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Avasam_speedrun.com_global_scoreboard_webapp&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=Avasam_speedrun.com_global_scoreboard_webapp)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Avasam_speedrun.com_global_scoreboard_webapp&metric=ncloc)](https://sonarcloud.io/dashboard?id=Avasam_speedrun.com_global_scoreboard_webapp)  
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=Avasam_speedrun.com_global_scoreboard_webapp&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=Avasam_speedrun.com_global_scoreboard_webapp)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Avasam_speedrun.com_global_scoreboard_webapp&metric=security_rating)](https://sonarcloud.io/dashboard?id=Avasam_speedrun.com_global_scoreboard_webapp)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=Avasam_speedrun.com_global_scoreboard_webapp&metric=sqale_index)](https://sonarcloud.io/dashboard?id=Avasam_speedrun.com_global_scoreboard_webapp)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Avasam_speedrun.com_global_scoreboard_webapp&metric=code_smells)](https://sonarcloud.io/dashboard?id=Avasam_speedrun.com_global_scoreboard_webapp)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=Avasam_speedrun.com_global_scoreboard_webapp&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=Avasam_speedrun.com_global_scoreboard_webapp)  

### **[See the scoreboard](https://www.Avasam.dev/)**

There you can also update and bookmark any user you want.

---

### tl;dr / disclaimer

In layman's terms, the formula gives you more points the shorter your time is and the more players there are. Which encourages having a decent time (not necessarily a top time) in multiple games. It does not, at any point, try to identify anyone as being the best speedrunner out there. Such a thing does not exist as different games require different skillsets and runners are best at what they do. The results from this **score**board ought to be taken with a grain of salt.

That being said, go out there and challenge your friends by showing them how many more points you got than them :P If this app can encourage some of you to try new games, I'll be satisfied.

## How it works

*Note: Whilst most of the quirks have been figured out, there could still be changes that affect current scores.*

The score is calculated by summing up every valid PB of a user according to a formula which goes as follow:

1. Check if the run is valid. If not, the run is immediatly worth 0 points:
    - The user (or any, for multiplayer) is not banned from SR.C
    - Is not a multi-game run
    - Has video/image verification
    - The leaderboard (for the current sub-category) has at least 3 runs
    - Is part of a speedrun leaderboard, not a scoreboard
    - The WR time is not under a minute
        - ILs' WR should not be under their fraction of a minute (see step #7)
    - After step #4, not all runs have the same time
2. All runs not considered valid (w/o video/image verification or banned user) are removed from the leaderboard and can be considered as non-existant from now on.
3. Remove the last 5% of the leaderboard
4. 80th percentile soft cutoff: Find the time that's most often repeated in the leaderboard (at least thrice, after the 80th percentile) and cut off everything after that. This is for runs where there's a lot of similar times near the end of the leaderboard. We consider such times to be a "soft maximum limit". (Either because it's impossible to do worse, or because you may have to intentionally go slow)
From this step onward, the amount of runners in the leaderboard will be reffered to as the "population".
Note: The soft cutoff works great on games such as Barney. But is too punishing on games such as Mario 1. To be improved.
5. Generate a logaritmic curve that looks somewhat like below. Where the average time ≤ e-1 and the last run is worth 0  
![Curve Example](/assets/images/Curve%20example.jpg)
    - 5.1. A signed deviation from the mean is obtained for all the runs
    - 5.2. The deviation is adjusted so that the last run is worth 0 points. By adding the lowest (unsigned) deviation to the signed deviation
    - 5.3. The deviation is then normalized so that the average time is worth 1 point and the last run is still worth 0 points. By dividing the adjusted deviation with the lowest deviation (from before the step #4 cutoff, if it applies). Capped at π.
    - 5.4. Points for a run are equal to: `e`<sup>`normalized_deviation * certainty_adjustment`</sup>`- 1` which creates the logarithmic curve that starts at 0
        - `certainty_adjustment = 1 - 1 / (population - 1)`
6. The points for a run are then multiplied by a "length bonus" and the decimal point is shifted to the right by 1.
    - `length_bonus = 1 + (wr_time / TIME_BONUS_DIVISOR)`. This is to slightly bonify longuer runs which which usually require more time put in the game to achieve a similar level of execution
        - `TIME_BONUS_DIVISOR = 3600 * 12`: 12h (1/2 day) for +100%
7. If the run is an IL (Individual Level), the points are divided by "the quantity of ILs for the game + 1" (`points / (level_count + 1)`)
8. A diminishing return is applied for runs under the same game (this includes mods and ROMHacks) starting at the third run. The curve is a mirrored Sigmoid (aka Logistic). Which means the first 2 best runs under a game are untouched, and no run can be diminished to 0. Below are a visual representation, you can click on the images for further details.
    - Individual levels are grouped together as a single step of diminishing return.

<!-- markdownlint-disable MD033 -->
|[![Diminishing return example](/assets/images/diminishing-return-desmos-graph.svg)](https://www.desmos.com/calculator/2zskz4jytl)|<nobr>`1 / (1 + e`<sup>`x - τ`</sup>`)`</nobr><br /><br />  [<img alt="Diminishing return fomula" src="/assets/images/diminishing-return-wolfram-alpha-input.gif" width="540px"/>](https://www.wolframalpha.com/input?i=Piecewise%5B%7B%7B1%2F%281+%2B+e%5E%28x+-+2π%29%29%2C+x+>+2%7D%2C+%7B1%2C+x+<%3D+2%7D%7D%5D)|
|-|-|
<!-- markdownlint-disable-next-line MD029 -->
9. Finally, while all currently valid personal bests will be shown, only the top 60 will be counted in order to help reduce the "quantity over quality" game.
    - Since Ils are only worth a fraction, they are also weighted a fraction of the top 60. Full Games are always 1 spot.

---

## Dev environment setup

Get yourself a [MySQL server](https://dev.mysql.com/downloads/mysql/) (as of 2022/13/08, PythonAnywhere uses version 8.0.25, MySQL Server 5.7.34)  
Install [Python](https://www.python.org/downloads/) 3.9 or above (PythonAnywhere runs on 3.10)  
Run `./scripts/install.bat` to install the required dependencies.  
Copy `configs.template.py` as `configs.py` and update the file as needed.  
If needed, copy `.env.development` as `.env.development.local` and update the file.  

### Running the app

- From the root of the project: `py ./backend/flask_app.py`, to launch the backend server
- From the root of a React app: `npm run start`, to serve the app  

These steps are missing setting up a virtual environment, but if you care about that, you'll know how to set it up yourself. In any case you can let me know if you have issues setting up your dev environment.

<!-- [![Dependabot status](https://api.dependabot.com/badges/status?host=github&repo=Avasam/speedrun.com_global_scoreboard_webapp)](https://github.com/dependabot/dependabot-core/issues/1912) -->
