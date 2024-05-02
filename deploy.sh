#!/bin/bash
# © Copyright IBM Corporation 2023, 2024
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
BLOCK_STORAGE=${3:-"ocs-storagecluster-ceph-rbd"}
INSTALL_CP4I=${4:-true}

API_CONNECT_CLUSTER_NAME=ademo
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [ -z $NAMESPACE ]
then
    echo "Usage: deploy.sh <namespace for deployment> <file storage class> <block storage class>"
    exit 1
fi

oc new-project $NAMESPACE 2> /dev/null
oc project $NAMESPACE

if [ "$INSTALL_CP4I" = true ] ; then
  oc patch storageclass $BLOCK_STORAGE -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
  oc patch storageclass $FILE_STORAGE -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
fi

./install-operators.sh

if [ "$INSTALL_CP4I" = true ] ; then
  echo ""
  line_separator "START - INSTALLING PLATFORM NAVIGATOR"
  cat $SCRIPT_DIR/setupResources/platform-nav.yaml_template |
  sed "s#{{NAMESPACE}}#$NAMESPACE#g;" > $SCRIPT_DIR/setupResources/platform-nav.yaml

  oc apply -f setupResources/platform-nav.yaml
  sleep 30

  END=$((SECONDS+3600))
  PLATFORM_NAV=FAILED

  while [ $SECONDS -lt $END ]; do
    PLATFORM_NAV_PHASE=$(oc get platformnavigator platform-navigator -o=jsonpath={'.status.conditions[].type'})
    if [[ $PLATFORM_NAV_PHASE == "Ready" ]]
    then
      echo "Platform Navigator available"
      PLATFORM_NAV=SUCCESS
      break
    else
      echo "Waiting for Platform Navigator to be available"
      sleep 60
    fi
  done

  if [[ $PLATFORM_NAV == "SUCCESS" ]]
  then
    echo "SUCCESS"
  else
    echo "ERROR: Platform Navigator failed to install after 60 minutes"
    exit 1
  fi
  line_separator "SUCCESS - INSTALLING PLATFORM NAVIGATOR"
fi

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
      echo "Waiting for API Connect to be available"
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


echo ""
line_separator "START - INSTALLING ASSET REPO"

cat $SCRIPT_DIR/setupResources/assetrepo.yaml_template |
  sed "s#{{NAMESPACE}}#$NAMESPACE#g;" |
  sed "s#{{FILE_STORAGE}}#$FILE_STORAGE#g;" |
  sed "s#{{BLOCK_STORAGE}}#$BLOCK_STORAGE#g;" > $SCRIPT_DIR/setupResources/assetrepo.yaml

oc apply -f setupResources/assetrepo.yaml


END=$((SECONDS+3600))
AR=FAILED
while [ $SECONDS -lt $END ]; do
    AR_PHASE=$(oc get AssetRepository assetrepo -o=jsonpath={'..phase'})
    if [[ $AR_PHASE == "Ready" ]]
    then
      echo "Asset Repo available"
      AR=SUCCESS
      break
    else
      echo "Waiting for Asset Repo to be available"
      sleep 60
    fi
done
sleep 60 
line_separator "SUCCESS - ASSET REPO CREATED"

echo ""
line_separator "START - INSTALLING IBM APP CONNECT"

cat $SCRIPT_DIR/setupResources/appconnect-dashboard.yaml_template |
  sed "s#{{NAMESPACE}}#$NAMESPACE#g;" |
  sed "s#{{FILE_STORAGE}}#$FILE_STORAGE#g;" |
  sed "s#{{BLOCK_STORAGE}}#$BLOCK_STORAGE#g;" > $SCRIPT_DIR/setupResources/appconnect-dashboard.yaml

oc apply -f setupResources/appconnect-dashboard.yaml


END=$((SECONDS+3600))
APP_CONNECT=FAILED
while [ $SECONDS -lt $END ]; do
    APP_CONNECT_PHASE=$(oc get DesignerAuthoring ace-designer-demo -o=jsonpath={'..phase'})
    if [[ $APP_CONNECT_PHASE == "Ready" ]]
    then
      echo "App Connect available"
      APP_CONNECT=SUCCESS
      break
    else
      echo "Waiting for App Connect to be available"
      sleep 60
    fi
done

line_separator "SUCCESS - IBM APP CONNECT CREATED"

./configure-apiconnect.sh -n $NAMESPACE -r $API_CONNECT_CLUSTER_NAME
#./configure-assetrepo.sh -n $NAMESPACE -r assetrepo
echo ""
echo ""
line_separator "User Interfaces"
PLATFORM_NAV_USERNAME=$(oc get secret integration-admin-initial-temporary-credentials -o=jsonpath={.data.username} | base64 -d)
PLATFORM_NAV_PASSWORD=$(oc get secret integration-admin-initial-temporary-credentials -o=jsonpath={.data.password} | base64 -d)
PLATFORM_NAVIGATOR_URL=$(oc get route platform-navigator-pn -o jsonpath={'.spec.host'})
echo "Platform Navigator URL: https://$PLATFORM_NAVIGATOR_URL"
echo "Username: $PLATFORM_NAV_USERNAME"
echo "Password: $PLATFORM_NAV_PASSWORD"
echo ""
