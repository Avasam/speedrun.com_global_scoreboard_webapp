# speedrun.com global scoreboard Webapp

The webapp version of an unofficial speedrun.com global scoreboard for competitive speedrunning

Disclaimer: Whilst most of the quirks have been figured out, there could still be changes that affect current scores.

### **[See the scoreboard](https://avasam.pythonanywhere.com/)**

There you can also update and bookmark any user you want.

How the score is calculated:

- The sum of every valid PB of a user is scored according to a formula. TODO: new formula based on time's standart deviation, WR, Median and mean.  
- Said formula gives you more points the shorter your time is and the more players there are. Which encourages having a good time in games with a lot of players without having to be first (altough being in the top does give a lot of points because you have a lot more competition).
- The only 2 arbitrary numbers are: 4 and 60%
  - 4 (3?)is the minimum amount of players that should be present in a leaderboard.
  - The last 5% of a leaderboard is ignored.
  - The 60th percentile in a leaderboard is worth 1 point.
  - The last run is worth 0 points.
  - TODO: 80/20 soft cutoff

Individual levels are worth a fraction of full-game runs: `1 / (number_of_IL + 1)`.

Runs w/o video/image verifications are not considered AND not counted.

Scoreboards and multi-games are also ignored.

## Dev environment setup

Get yourself a [MySQL server](https://dev.mysql.com/downloads/mysql/) (PythonAnywhere uses version 5.6.40)  
Install [Python](https://www.python.org/downloads/) 3.6+  
Install PIP (this should come bundled with python 3.4+)  
Run this command through the python interpreter (or prepend with `py -m` in a terminal): `pip install flask flask_cors flask_login flask_sqlalchemy sqlalchemy httplib2 simplejson mysql-connector requests pyjwt`  
Copy `configs.template.py` as `configs.py` and update the file as needed.  
If needed, copy `.env.development` as `.env.development.local` and update the file.  

### Running the app

- From the root of the project: `py ./flask_app.py`, to launch the backend server
- From the root of a React app: `npm run start`, to serve the app  

These steps are missing setting up a virtual environment, but if you care about that, you'll know how to set it up yourself. In any case you can let me know if you have issues setting up your dev environment.
