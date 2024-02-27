// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import EStyleSheet from 'react-native-extended-stylesheet';
import { Platform } from 'react-native';
import { isLandscape, isMobileWeb } from '../../utils/helper';

const tvContentStyle = Platform.OS === 'ios' ? '70%' : '56%';
const nativeContentStyle = Platform.isTV
	? tvContentStyle
	: isLandscape()
		? '20%'
		: '25%';
const videoStyles = EStyleSheet.create({
	rowContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '50%',
		'@media ios': {
			width: '100%',
			marginTop: 15,
			marginBottom: 15,
		},
		'@media android': {
			width: '100%',
			marginTop: 15,
			marginBottom: 15,
		},
	},
	rowContainerSmall: {
		flexDirection: 'row',
		width: isMobileWeb() ? '100%' : '22%',
		justifyContent: 'space-around',
		marginTop: isMobileWeb() ? 15 : 0,
		'@media ios': {
			width: Platform.isTV ? '25%' : '100%',
			marginTop: 15,
			marginBottom: 15,
		},
		'@media android': {
			width: Platform.isTV ? '30%' : '100%',
			marginTop: 15,
			marginBottom: 15,
		},
	},
	contentType: {
		color: 'white',
		fontWeight: 'bold',
		marginLeft: 10,
		letterSpacing: 1,
		fontSize: '1rem',
		'@media ios': {
			paddingTop: 12,
			fontSize: '0.8rem',
		},
		'@media android': {
			paddingTop: 12,
			fontSize: '0.8rem',
		},
	},
	contentStyle: {
		// Video is holding its original aspect ratio in android/ios and auto-adjusted based on the height given
		width: '100%',
		height: (Platform.OS === 'web' && !isMobileWeb()) ? '95vh' : nativeContentStyle,
	},
	contentWebAndTVStyle: {
		// Video is holding its original aspect ratio in android/ios and auto-adjusted based on the height given
		width: '69%',
		height: (Platform.OS === 'web' && !isMobileWeb()) ? '95vh' : nativeContentStyle,
		alignItems: 'center',
		margin: 'auto',
		backgroundColor: 'black',
	},
	videoSubHeader: {
		width: '100%',
		backgroundColor: 'steelblue',
		position: 'relative',
		zIndex: 9999,
	},
	videoControlsBanner: {
		justifyContent: 'flex-start',
		backgroundColor: 'steelblue',
		opacity: 0.8,
		zIndex: 99999,
		bottom: 0,
		width: '100%',
		paddingLeft: 10,
		paddingRight: 10,
		paddingTop: 10,
		paddingBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
		'@media ios': {
			position: 'relative',
			width: '100%',
			justifyContent: 'flex-start',
			opacity: Platform.isTV ? 0.8 : 1,
			height: Platform.isTV ? '30%' : '50%',
		},
		'@media android': {
			position: 'relative',
			justifyContent: 'flex-start',
			paddingTop: Platform.isTV ? 2 : 10,
			paddingBottom: Platform.isTV ? 2 : 10,
			opacity: Platform.isTV ? 0.8 : 1,
			height: Platform.isTV ? '40%' : '50%',
		},
		'@media web': {
			position: isMobileWeb() ? 'relative' : 'fixed',
		}
	},
	logsStyles: {
		color: '#ffffff',
		backgroundColor: '#000000',
		opacity: 0.7,
		width: isMobileWeb() ? '95%' : '24.2%',
		'@media android': {
			height: Platform.isTV ? '90%' : '80%',
			width: Platform.isTV ? '45.5%' : '95%',
			overflow: 'hidden',
		},
		'@media ios': {
			height: Platform.isTV ? '90%' : '80%',
			width: Platform.isTV ? '45.5%' : '95%',
			overflow: 'hidden',
		},
	},
	logContainer: {
		position: isMobileWeb() ? 'absolute' : 'fixed',
		width: isMobileWeb() ? '100%' : '100vw',
		height: isMobileWeb() ? '65%' : '75vh',
		top: '10%',
		flexDirection: 'row',
		justifyContent: 'space-around',
		zIndex: 9999,
		'@media android': {
			position: 'absolute',
			width: '100%',
			height: '65%',
			top: '5.5%',
		},
		'@media ios': {
			position: 'absolute',
			width: '100%',
			height: '65%',
			top: '5.5%',
		},
	},
	logButton: {
		borderColor: '#8f8c8c',
		borderWidth: 1,
		height: 30,
	},
	logTitle: {
		fontSize: '1.2rem',
		fontWeight: 'bold',
		textTransform: 'uppercase',
		paddingLeft: 15,
		color: 'yellow',
		borderColor: 'white',
		borderBottomWidth: 1,
		textAlign: 'center',
		paddingTop: 10,
		paddingBottom: 10,
		backgroundColor: 'steelblue',
		'@media android': {
			fontSize: '1rem',
		},
		'@media ios': {
			fontSize: '1rem',
		},
	},
	logText: {
		color: '#ffffff',
		paddingLeft: 20,
		paddingTop: 10,
	},
	textStyleSmall: {
		fontSize: '1rem',
		color: 'white',
	},
	fullscreenMode: {
		width: '100%',
		height: Platform.OS === 'ios' ? 500 : '43.5%',
	},
	fullscreenModeLandscape: {
		width: '100%',
		height: Platform.OS === 'ios' ? 280 : '15%',
	},
});

export default videoStyles;
