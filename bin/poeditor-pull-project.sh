#!/bin/bash
PROJECT_ID=125447
OUTPUT_DIR=lang/strings
LANGUAGES=("he" "tr" "zh-TW")
LANG_NAMES=("Hebrew" "Turkish" "Chinese")
LANG_COUNT=${#LANGUAGES[@]}

# argument processing from https://stackoverflow.com/a/14203146
while [[ $# -gt 1 ]]
do
key="$1"

case $key in
    -a|--api_token)
    API_TOKEN="$2"
    shift # past argument
    ;;
    -o|--output_dir)
    OUTPUT_DIR="$2"
    shift # past argument
    ;;
esac
shift # past argument or value
done

for (( i=0; i<=$(( $LANG_COUNT-1 )); i++ ))
do
    LANGUAGE="${LANGUAGES[$i]}"
    PULLARGS="-p $PROJECT_ID -l $LANGUAGE -o $OUTPUT_DIR -a $API_TOKEN"
    # echo "PULLARGS=$PULLARGS"
    ./bin/poeditor-pull.sh $PULLARGS

    LANG_CODE=$(echo $LANGUAGE | cut -d '-' -f 1)
    LANG_NAME="${LANG_NAMES[$i]}"
    # convert to JavaScript and copy into appropriate location
    sed "s/^{/SC.stringsFor(\"$LANG_CODE\", {/; s/^}$/});/" \
        <"$OUTPUT_DIR/$LANGUAGE.json" >"apps/dg/$LANG_CODE.lproj/strings.js"
done

# special case for copying English strings
sed "s/^{/SC.stringsFor(\"en\", {/; s/^}$/});/" \
    <"$OUTPUT_DIR/en-US.json" >"apps/dg/english.lproj/strings.js"
