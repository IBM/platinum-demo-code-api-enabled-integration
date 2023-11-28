#!/bin/bash
# © Copyright IBM Corporation 2023
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

function line_separator () {
  echo "####################### $1 #######################"
}

NAMESPACE=${1:-"cp4i"}
FILE_STORAGE=${2:-"ocs-storagecluster-cephfs"}
BLOCK_STORAGE=${3:-"thin"}

API_CONNECT_CLUSTER_NAME=ademo
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [ -z $NAMESPACE ]
then
    echo "Usage: deploy.sh <namespace for deployment> <file storage class> <block storage class>"
    exit 1
fi

oc new-project $NAMESPACE 2> /dev/null
oc project $NAMESPACE

./install-operators.sh

echo ""
line_separator "START - INSTALLING API CONNECT"

cat $SCRIPT_DIR/setupResources/apic-cluster.yaml_template |
  sed "s#{{NAMESPACE}}#$NAMESPACE#g;" > $SCRIPT_DIR/setupResources/apic-cluster.yaml

oc apply -f setupResources/apic-cluster.yaml
sleep 30

END=$((SECONDS+3600))
API_CONNECT=FAILED

while [ $SECONDS -lt $END ]; do
    API_PHASE=$(oc get apiconnectcluster $API_CONNECT_CLUSTER_NAME -o=jsonpath={'..phase'})
    if [[ $API_PHASE == "Ready" ]]
    then
      echo "API Connect available"
      API_CONNECT=SUCCESS
      break
    else
      echo "Waiting for API Connect to be available - this may take 60 minutes to complete"
      sleep 60
    fi
done

if [[ $API_CONNECT == "SUCCESS" ]]
then
  echo "SUCCESS"
else
  echo "ERROR: API Connect failed to install after 60 minutes"
  exit 1
fi

line_separator "SUCCESS - INSTALLING API CONNECT"

line_separator "START - INSTALLING BANK SERVICE"

cd $SCRIPT_DIR/bankingservice

./deploy.sh $NAMESPACE

cd $SCRIPT_DIR/apiloadgenerator

./deploy.sh $NAMESPACE

cd $SCRIPT_DIR/authenticationservice

./deploy.sh $NAMESPACE

cd $SCRIPT_DIR

line_separator "SUCCESS - INSTALLING BANK SERVICE"

./configure-apiconnect.sh -n $NAMESPACE -r $API_CONNECT_CLUSTER_NAME

echo ""
echo ""
line_separator "User Interfaces"
PLATFORM_NAVIGATOR_URL=$(oc get route platform-navigator-pn -o jsonpath={'.spec.host'})
echo "Platform Navigator URL: https://$PLATFORM_NAVIGATOR_URL"
echo ""
