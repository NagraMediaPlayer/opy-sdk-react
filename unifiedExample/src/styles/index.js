// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {StyleSheet} from 'react-native';
import {isWeb} from '../Utils';

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 1,
		paddingHorizontal: 32,
		borderRadius: 10,
		elevation: 30,
		width: '95%',
		marginTop: 2,
		marginBottom: 2,
		marginLeft: 20,
		marginRight: 20,
	},
	buttonNormal: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 2,
		paddingHorizontal: 32,
		borderRadius: 10,
		elevation: 30,
		width: '50%',
		marginTop: 2,
		marginBottom: 2,
		marginLeft: 20,
		marginRight: 20,
		backgroundColor: '#3273a8',
	},
	buttonPress: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 2,
		paddingHorizontal: 32,
		borderRadius: 10,
		elevation: 30,
		width: '95%',
		marginTop: 2,
		marginBottom: 2,
		marginLeft: 20,
		marginRight: 20,
		backgroundColor: '#9CE563',
	},
	buttonHover: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 5,
		paddingHorizontal: 32,
		borderRadius: 10,
		elevation: 30,
		width: '55%',
		marginTop: 5,
		marginBottom: 5,
		marginLeft: 20,
		marginRight: 20,
		backgroundColor: '#071F30',
	},
	text: {
		fontSize: isWeb() ? '1.4vh' : 16,
		lineHeight: 21,
		fontWeight: 'bold',
		letterSpacing: 0.25,
		color: 'white',
	},

	keyHintsViewStyle: {
		zIndex: 1,
		top: 600,
		left: 0,
		position: 'absolute',
		backgroundColor: 'black',
		opacity: 0.6,
		width: '50%',
	},

	keyHintsTextStyle: {
		fontSize: 16,
		color: 'white',
		textAlign: 'left',
	},
});

export default styles;
