# speedrun.com global leaderboard Webapp
The webapp version of an unofficial speedrun.com global leaderboard for competitive speedrunning

Disclaimer: This is still in early testing and subject to drastic changes if needed.


### **[See the leaderboard](https://avasam.pythonanywhere.com/)**
There you can also update any user you want.

How the score is calculated:
- The sum of every valid PB of a user is scored according to a formula. (see [Formula/Curves](https://docs.google.com/spreadsheets/d/1Wv63zu3YY7vAJAzWgZwL4rHE9esxxN0B8DztJgNyjiQ#gid=156937478))
- Said formula gives you more points the closest to #1 you are on a leaderboard and the more players there are. Which encourages having a good rank in games with a lot of players without having to be first (altough being in the top does give a lot of points because you have a lot more competition).
- The only 2 arbitrary numbers are: 4 and 60%
    - 4 is the minimum amount of players that should be present in a leaderboard.
    - 60% minimum percentile needed in a leaderboard for a run to be worth any point.

Individual levels are not considered atm (only full game runs).

Runs w/o video/image verifications are not considered AND not counted.

If there's any balance issue in the formulas, that's an easy fix. (but that's literally just changing numbers, I'm not too worried about it).


## Dev environment setup
Get yourself a [MySQL server](https://dev.mysql.com/downloads/mysql/) (PythonAnywhere uses version 5.6.40)  
Install [Python](https://www.python.org/downloads/) 3.6+  
Install PIP  
Run `pip install flask flask_login flask_sqlalchemy sqlalchemy httplib2 simplejson mysql-connector`  
Copy `configs.py.template` as `configs.py` and update the file as needed.

I'm probably missing steps 🤷 (and setting up a virtual environment, but if you care about that, you'll know how to set it up yourself). In any case you can let me know if you have issues setting up your dev environment.
