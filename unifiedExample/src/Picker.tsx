// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
// @ts-ignore
import { Picker } from "react-native";
import { Picker as PickerNew } from "@react-native-picker/picker"

//console.log("PickerCore:"+Picker);
//console.log("PickerNew:"+PickerNew);

var Pickercustom = (Picker) ? Picker:PickerNew;

// var Picker = PickerCore;
// var Picker = PickerNew;
// console.log("Picker:"+Pickercustom);
//console.log("Picker.Item12345:"+Pickercustom.Item);

export default Pickercustom;
