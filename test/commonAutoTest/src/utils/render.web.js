// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import ReactDOM from "react-dom";

export async function renderComponent(componentToRender) {
	ReactDOM.render(componentToRender, document.getElementById("root"));
}
