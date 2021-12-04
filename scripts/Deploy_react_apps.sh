if [ -f tournament-scheduler-build.zip ]; then
  rm -rfv tournament-scheduler/build
  unzip -o tournament-scheduler-build.zip -d tournament-scheduler/
fi
if [ -f global-scoreboard-build.zip ]; then
  rm -rfv global-scoreboard/build
  unzip -o global-scoreboard-build.zip -d global-scoreboard/
fi
