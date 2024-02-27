// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { Text, TouchableOpacity } from "react-native";
import React, { useEffect } from "react";

import styles from "./styles";

function ExampleButton({
  navigation,
  buttonText,
  focusLabel,
  setFocusLabel,
  registrationCallback,
}) {
  useEffect(() => {
    registrationCallback(buttonText);

    return () => { };
  }, []);
  return (
    <TouchableOpacity
      style={
        focusLabel === buttonText ? styles.buttonHover : styles.buttonNormal
      }
      onFocus={() => {
        setFocusLabel(buttonText);
      }}
      onBlur={() => {
        setFocusLabel("");
      }}
      activeOpacity={0.8}
      onPress={() => navigation.navigate(buttonText)}
    >
      <Text style={styles.text}>{buttonText}</Text>
    </TouchableOpacity>
  );
}

export default ExampleButton;
