// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from "react";
import { View, Text } from "react-native";

export function createTextComponent(text) {
	const textComp = React.createElement(
		Text,
		{
			style: { alignSelf: "center", color: "white" },
		},
		text
	);

	return React.createElement(
		View,
		{
			width: "100%",
			height: "100%",
		},
		textComp
	);
}
