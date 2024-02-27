// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import EStyleSheet from 'react-native-extended-stylesheet';
const commonStyles = EStyleSheet.create({
	smallPicker: {
		backgroundColor: '#000000',
		color: '#ffffff',
		padding: 5,
		fontSize: '1rem',
		width: '100%',
		'@media ios': {
			fontSize: '0.6rem',
			width: '70%',
		},
		'@media android': {
			fontSize: '0.6rem',
			width: '70%',
		},
	},
	whiteBoldText: {
		color: 'white',
		fontWeight: 'bold',
	},
});

export default commonStyles;
