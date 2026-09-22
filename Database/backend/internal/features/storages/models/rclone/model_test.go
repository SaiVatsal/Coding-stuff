package rclone_storage

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_ParseConfigContent_SingleRemote_ParsedCorrectly(t *testing.T) {
	content := `[myremote]
type = s3
provider = AWS
access_key_id = AKIAIOSFODNN7EXAMPLE
secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
region = us-east-1`

	sections, err := parseConfigContent(content)

	require.NoError(t, err)
	require.Len(t, sections, 1)
	assert.Equal(t, "s3", sections["myremote"]["type"])
	assert.Equal(t, "AWS", sections["myremote"]["provider"])
	assert.Equal(t, "AKIAIOSFODNN7EXAMPLE", sections["myremote"]["access_key_id"])
	assert.Equal(t, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", sections["myremote"]["secret_access_key"])
	assert.Equal(t, "us-east-1", sections["myremote"]["region"])
}

func Test_ParseConfigContent_MultipleRemotes_AllParsed(t *testing.T) {
	content := `[remote1]
type = s3
region = us-east-1

[remote2]
type = drive
client_id = abc123`

	sections, err := parseConfigContent(content)

	require.NoError(t, err)
	assert.Len(t, sections, 2)
	assert.Equal(t, "s3", sections["remote1"]["type"])
	assert.Equal(t, "us-east-1", sections["remote1"]["region"])
	assert.Equal(t, "drive", sections["remote2"]["type"])
	assert.Equal(t, "abc123", sections["remote2"]["client_id"])
}

func Test_ParseConfigContent_EmptyContent_ReturnsEmptyMap(t *testing.T) {
	sections, err := parseConfigContent("")

	require.NoError(t, err)
	assert.Empty(t, sections)
}

func Test_ParseConfigContent_CommentsAndBlankLines_Ignored(t *testing.T) {
	content := `# This is a comment
; Another comment

[myremote]
type = s3

# inline comment line
region = eu-west-1`

	sections, err := parseConfigContent(content)

	require.NoError(t, err)
	require.Len(t, sections, 1)
	assert.Equal(t, "s3", sections["myremote"]["type"])
	assert.Equal(t, "eu-west-1", sections["myremote"]["region"])
}

func Test_ParseConfigContent_ValueWithEqualsSign_PreservesFullValue(t *testing.T) {
	content := `[myremote]
type = s3
secret_access_key = abc=def=ghi`

	sections, err := parseConfigContent(content)

	require.NoError(t, err)
	assert.Equal(t, "abc=def=ghi", sections["myremote"]["secret_access_key"])
}

func Test_ParseConfigContent_KeyWithoutValue_EmptyString(t *testing.T) {
	content := `[myremote]
type =
provider = AWS`

	sections, err := parseConfigContent(content)

	require.NoError(t, err)
	assert.Equal(t, "", sections["myremote"]["type"])
	assert.Equal(t, "AWS", sections["myremote"]["provider"])
}

func Test_ParseConfigContent_KeyValueOutsideSection_Ignored(t *testing.T) {
	content := `orphan_key = orphan_value
[myremote]
type = s3`

	sections, err := parseConfigContent(content)

	require.NoError(t, err)
	assert.Len(t, sections, 1)
	assert.Equal(t, "s3", sections["myremote"]["type"])
}

func Test_ParseConfigContent_WhitespaceAroundKeysAndValues_Trimmed(t *testing.T) {
	content := `[myremote]
  type   =   s3
  region   =   us-west-2  `

	sections, err := parseConfigContent(content)

	require.NoError(t, err)
	assert.Equal(t, "s3", sections["myremote"]["type"])
	assert.Equal(t, "us-west-2", sections["myremote"]["region"])
}
