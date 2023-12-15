#!/bin/bash

oc delete builds oauthviewer-1 
oc delete buildconfig oauthviewer
oc delete imagestream oauthviewer
oc delete deployment oauthviewer
oc delete service oauthviewer
oc delete route oauthviewer
