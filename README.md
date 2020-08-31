# speedrun.com global scoreboard Webapp

The webapp version of an unofficial speedrun.com global scoreboard for competitive speedrunning

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
    - The user (or any, for multipler) is not banned from SRC
    - Is not a multi-game run
    - Has video/image verification
    - The leaderboard (for the current sub-category) has at least 3 runs
    - Is part of a speedrun leaderboard, not a scoreboard
    - After step #5, not all runs have the same time
    - After step #5, the WR time is not under a minute
        - ILs' WR should not be under their fraction of a minute (see step #7)
2. Due to current limitations with PythonAnywhere and the speedrun.com api, only up to the last 1000 runs will be kept.
3. All runs not considered valid (w/o video/image verification or banned user) runs are removed from the leaderboard and can be considered as non-existant from now on.
4. Remove the last 5% of the leaderboard
5. 80th percentile soft cutoff: Find the time that's most often repeated in the leaderboard (at least thrice, after the 80th percentile) and cut off everything after that. This is for runs where there's a lot of similar times near the end of the leaderboard. We consider such times to be the a "soft maximum limit". (Either because ti's impossible to do worse, or because you have to go slow)  
From this step onward, the amount of runners in the leaderboard will be reffered to as the "population". Except for step #6.3 where the lowest deviation is be taken from before the cutoff.
6. Generate a logaritmic curve that looks somewhat like below. Where the average time = 1 and the last run is worth 0  
![Curve Example](/assets/images/Curve%20example.jpg)
    - 6.1. A signed standart deviation is obtained for all the runs
    - 6.2. The deviation is adjusted so that the last run is worth 0 points. By adding the lowest (unsigned) deviation to the signed deviation
    - 6.3. The deviation is then normalized so that the average time is worth 1 point and the last run is still worth 0 points. By dividing the adjusted deviation with the adjusted lowest deviation. Capped at π.
    - 6.4. Points for a run are equal to: `e^(normalized_deviation * certainty_adjustment)`
        - `certainty_adjustment = 1 - 1 / (population - 1)`
7. The points for a run are then multiplied by a "length bonus", the decimal point is shifted to the right by 1 and is capped at 999.99
    - `length_bonus = 1 + (wr_time / TIME_BONUS_DIVISOR)`. This is to slightly bonify longuer runs which which usually require more time put in the game to achieve a similar level of execution
        - `TIME_BONUS_DIVISOR = 3600 * 12`: 12h (1/2 day) for +100%
8. Finally, if the run is an IL (Individual Level), the points are divided by "the quantity of ILs for the game + 1"

---

## Dev environment setup

Get yourself a [MySQL server](https://dev.mysql.com/downloads/mysql/) (PythonAnywhere uses version 5.6.40)  
Install [Python](https://www.python.org/downloads/) 3.7+  
Install PIP (this should come bundled with python 3.4+)  
Run this command through the python interpreter (or prepend with `py -m` in a terminal): `pip install flask flask_cors flask_sqlalchemy sqlalchemy httplib2 simplejson mysql-connector requests pyjwt`  
Copy `configs.template.py` as `configs.py` and update the file as needed.  
If needed, copy `.env.development` as `.env.development.local` and update the file.  

### Running the app

- From the root of the project: `py ./flask_app.py`, to launch the backend server
- From the root of a React app: `npm run start`, to serve the app  

These steps are missing setting up a virtual environment, but if you care about that, you'll know how to set it up yourself. In any case you can let me know if you have issues setting up your dev environment.
