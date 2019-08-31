if [ "$1" != "-d" ]; then
  tmp_file=/tmp/lastchanged$(pwd | tr / -)
  if [ -f $tmp_file ]; then
    files=$(find src -newer $tmp_file)
    if [ "$files" != "" ]; then
      task build
    fi
  fi
  touch $tmp_file
  exit
fi

watch -n10 ./watch.sh
