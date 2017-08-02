#!/usr/bin/python
# -*- coding: utf-8 -*-

from user_updater import auto_update_users
import sys, os

#sys.stdout = open(os.devnull, 'w')

#!Autoupdater
auto_update_users()

#sys.stdout = sys.__stdout__