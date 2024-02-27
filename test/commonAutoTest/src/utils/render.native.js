// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React, { useState, useImperativeHandle, forwardRef } from "react";
import { AppRegistry, View } from "react-native";

let defaultView = React.createElement(View, {
	width: "100%",
	height: "100%",
	backgroundColor: "black",
	color: "white",
});
let rootView = null;

function RootView(props, ref) {
	const [childComp, setChildComp] = useState(defaultView);

	function updateChild(comp) {
		setChildComp(comp);
	}

	useImperativeHandle(ref, () => ({
		updateChild,
	}));

	return <View style={{ width: "100%", height: "100%" }}>{childComp}</View>;
}
RootView = forwardRef(RootView);

let App = () => {
	return <RootView ref={(rootRef) => (rootView = rootRef)}></RootView>;
};

AppRegistry.registerComponent("refAppCommon", () => App);

export async function renderComponent(componentToRender) {
	if (rootView) {
		rootView.updateChild(componentToRender);
	}
}
