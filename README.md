# API Documentation

## feature.proto

Version: version not set

## Endpoints

| Path | Method | Parameters | Responses |
| ---- | ------ | ---------- | --------- |
| /ops/features | GET |  | 200:  Schema: [featureListFeaturesResponse](#featurelistfeaturesresponse) |
| /ops/features/{uuid} | PUT | uuid (required)<br />body (required) | 200:  Schema: [featureUpdateFeatureResponse](#featureupdatefeatureresponse) |

## Schemas

### featureFeature

| Property | Type | Description |
| -------- | ---- | ----------- |
| app_id | string |  |
| args | string |  |
| enabled | boolean |  |
| extra_data | [protobufStruct](#protobufstruct) |  |
| method | [featureFeatureFetchMethod](#featurefeaturefetchmethod) |  |
| requirements | string |  |
| type | [featureFeatureType](#featurefeaturetype) |  |
| updated_at | string (date-time) |  |
| uuid | string |  |

### featureFeatureFetchMethod

| Property | Type | Description |
| -------- | ---- | ----------- |
| enum | string[UNKNOWN_METHOD,GET] |  |

### featureFeatureType

| Property | Type | Description |
| -------- | ---- | ----------- |
| enum | string[UNKNOWN_FEATURE_TYPE,URL] |  |

### featureListFeaturesRequest

| Property | Type | Description |
| -------- | ---- | ----------- |
| enum | object |  |

### featureListFeaturesResponse

| Property | Type | Description |
| -------- | ---- | ----------- |
| features | [featureFeature[]](#featurefeature) |  |

### featureUpdateFeatureRequest

| Property | Type | Description |
| -------- | ---- | ----------- |
| extra_data | [protobufStruct](#protobufstruct) |  |
| token | string |  |
| uuid | string |  |

### featureUpdateFeatureResponse

| Property | Type | Description |
| -------- | ---- | ----------- |
| feature | [featureFeature](#featurefeature) |  |

### protobufListValue

| Property | Type | Description |
| -------- | ---- | ----------- |
| values | [protobufValue[]](#protobufvalue) | `ListValue` is a wrapper around a repeated field of values.<br /><br />The JSON representation for `ListValue` is JSON array. |

### protobufNullValue

| Property | Type | Description |
| -------- | ---- | ----------- |
| enum | string[NULL_VALUE] | `NullValue` is a singleton enumeration to represent the null value for the<br />`Value` type union.<br /><br /> The JSON representation for `NullValue` is JSON `null`.<br /><br /> - NULL_VALUE: Null value. |

### protobufStruct

| Property | Type | Description |
| -------- | ---- | ----------- |
| fields | object | `Struct` represents a structured data value, consisting of fields<br />which map to dynamically typed values. In some languages, `Struct`<br />might be supported by a native representation. For example, in<br />scripting languages like JS a struct is represented as an<br />object. The details of that representation are described together<br />with the proto support for the language.<br /><br />The JSON representation for `Struct` is JSON object. |

### protobufValue

| Property | Type | Description |
| -------- | ---- | ----------- |
| bool_value | boolean | `Value` represents a dynamically typed value which can be either<br />null, a number, a string, a boolean, a recursive struct value, or a<br />list of values. A producer of value is expected to set one of that<br />variants, absence of any variant indicates an error.<br /><br />The JSON representation for `Value` is JSON value. |
| list_value | [protobufListValue](#protobuflistvalue) | `Value` represents a dynamically typed value which can be either<br />null, a number, a string, a boolean, a recursive struct value, or a<br />list of values. A producer of value is expected to set one of that<br />variants, absence of any variant indicates an error.<br /><br />The JSON representation for `Value` is JSON value. |
| null_value | [protobufNullValue](#protobufnullvalue) | `Value` represents a dynamically typed value which can be either<br />null, a number, a string, a boolean, a recursive struct value, or a<br />list of values. A producer of value is expected to set one of that<br />variants, absence of any variant indicates an error.<br /><br />The JSON representation for `Value` is JSON value. |
| number_value | number (double) | `Value` represents a dynamically typed value which can be either<br />null, a number, a string, a boolean, a recursive struct value, or a<br />list of values. A producer of value is expected to set one of that<br />variants, absence of any variant indicates an error.<br /><br />The JSON representation for `Value` is JSON value. |
| string_value | string | `Value` represents a dynamically typed value which can be either<br />null, a number, a string, a boolean, a recursive struct value, or a<br />list of values. A producer of value is expected to set one of that<br />variants, absence of any variant indicates an error.<br /><br />The JSON representation for `Value` is JSON value. |
| struct_value | [protobufStruct](#protobufstruct) | `Value` represents a dynamically typed value which can be either<br />null, a number, a string, a boolean, a recursive struct value, or a<br />list of values. A producer of value is expected to set one of that<br />variants, absence of any variant indicates an error.<br /><br />The JSON representation for `Value` is JSON value. |

