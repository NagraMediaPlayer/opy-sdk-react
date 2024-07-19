// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React, { FC, ReactElement, useEffect, useState, useRef } from 'react';
import {
  FlatList,
  Text,
  View,
  Platform,
  TouchableHighlight,
  Image,
} from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import commonStyles from '../../assets/styles/commonStyles';
import assets from '../../constants/assets';
import TVEventHandler from '../../TVEventHandler';
import { isMobileWeb } from '../../utils/helper';

interface Props {
  label: string;
  data: any;
  onSelect: any;
  selected: any;
  pickerButtonStyle?: any;
  extraData?: any;
  focusedControl :any,
  setFocusedControl : (label: any) => void;
  focusOnEnter :any,
  setFocusOnEnter :() => void;
}


const CustomPicker: FC<Props> = ({
  label,
  data,
  onSelect,
  pickerButtonStyle,
  extraData,
  focusedControl,
  setFocusedControl,
  focusOnEnter,
  setFocusOnEnter
}) => {
  const flatListRef = useRef(null);
  const myComponentRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [focusedItem, setFocusedItem] = useState(Platform.OS === "web" ? 0 : null);
  const [itemHeight, setItemHeight] = useState( Platform.OS === "web" ? 0 : null);
  let tvEventHandler: any = null;
  let listData = (extraData && extraData.length > 0) ? [...extraData, ...data] : [...data];

  // Added this to manage TV keys
  useEffect(() => {
    _enableTVEventHandler();

    return () => {
      _disableTVEventHandler()
    }
  }, []);

  // Added Eventhandler to handle TV usecases
  const _enableTVEventHandler = () => {
    tvEventHandler = new TVEventHandler();
    tvEventHandler.enable(null, function (dropdownRef: any, evt: any) {
      // close popup when left button pressed in TV
      if (evt && (evt.eventType === 'left')) {
        setVisible(false);
      }
    });
  }

  const _disableTVEventHandler = () => {
    if (tvEventHandler) {
      tvEventHandler.disable();
    }
  }

  const toggleDropdown = (): void => {
    setVisible(!visible);
  };

  const handleOnPress = () => {
    toggleDropdown();
    if(Platform.OS === "web") {
      setFocusedControl(label)
    };
  };

  const onItemPress = (index: number): void => {
    let updatedIndex = extraData ? index - 1 : index;
    onSelect(updatedIndex);
    setVisible(false);
    if (Platform.OS === "web"){
      setFocusedItem(updatedIndex)
    }
  };

  const itemText = (itemToShow: any): string => {
    let labelForItem;

    if (itemToShow.title) {
      labelForItem = itemToShow.title;
      if (itemToShow.channelCount) {
        labelForItem += ` (${itemToShow.channelCount} channels)`;
      }
      if (itemToShow.encodeType) {
        labelForItem += ` [type ${itemToShow.encodeType}]`;
      }
      if (itemToShow.characteristics && itemToShow.characteristics.length > 0) {
        labelForItem += ` ${itemToShow.characteristics.join(', ')}`;
      }
    } else {
      labelForItem =
        itemToShow.name ||
        itemToShow.resolution ||
        (itemToShow / 1000).toString();
    }

    return labelForItem;
  };

  // @ts-ignore
  const renderItem = ({ item, index }): ReactElement<any, any> => (
    <TouchableHighlight
    style={[styles.item, focusedItem === index ? styles.focusedItem : null]}
    onPress={() => onItemPress(index)}
    activeOpacity={0.5}
    underlayColor="#eb6c3a"
    ref={myComponentRef} onLayout={() => {}}>
      <Text style={styles.listText} >{itemText(item)}</Text>
    </TouchableHighlight>
  );

  const renderBackButton = () => {
    let backText = Platform.isTV ? 'BACK [Use Left Key]' : 'BACK';
    return (
      <TouchableHighlight onPress={() => setVisible(false)} activeOpacity={0.5} underlayColor="#eb6c3a">
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, justifyContent: 'center', backgroundColor: 'grey' }}>
          <Text style={commonStyles.whiteBoldText} >{backText}</Text>
        </View>
      </TouchableHighlight>
    );
  };

  const getItemLayout = (_data, index) => ({
    length: itemHeight,
    offset:itemHeight* index,
    index,
  }
  );

  const createList = (listData) =>(
    <FlatList
    nestedScrollEnabled
    ref={flatListRef}
    getItemLayout={getItemLayout}
    data={listData}
    renderItem={renderItem}
    keyExtractor={(_item, index) => index.toString()}
    extraData={visible}
    decelerationRate={0.9}
    />
    );

    const renderDropdown = (): ReactElement<any, any> => {
      //@ts-ignore
      return visible ? (
      <View style={styles.customPicker}>
        {renderBackButton()}
        {createList(listData)}
     </View>
    ) : null;
  };

  const handleKeyDownForList = (event) => {
    if(visible){
      const lastIndex = listData.length - 1;
      if (event.key === 'ArrowUp') {
        setFocusedItem((prev) => (prev > 0 ? prev - 1 : lastIndex));
      } else if (event.key === 'ArrowDown') {
        setFocusedItem((prev) => (prev < lastIndex ? prev + 1 : 0));
      } else if (event.key === 'Enter') {
        onItemPress(focusedItem);
      } else if ((event.key === 'Backspace') || (event.key === 'Back')) {
        event.preventDefault();
        setVisible(false);
      }
    }
  };

  const handleFocusOnEnter = () => {
      if (focusOnEnter === label) {
        toggleDropdown();
        setFocusOnEnter("");
        setFocusedControl(label);
      }
  };

  useEffect(() => {
    if (Platform.OS === "web"){
      if (flatListRef.current && focusedItem >= 0 && focusedItem < listData.length) {
        flatListRef.current.scrollToIndex({ index: focusedItem, animated: true });
      }

      if (myComponentRef.current) {
        myComponentRef.current.measure((x, y, width, height, pageX, pageY) => {
          setItemHeight(height);
        });
      }

      handleFocusOnEnter();

      window.addEventListener('keydown', handleKeyDownForList)
      return()=>{
        window.removeEventListener('keydown', handleKeyDownForList)
      }
  }}, [handleFocusOnEnter, handleKeyDownForList, focusedItem, itemHeight]);
  return (
    <>
      <TouchableHighlight
        activeOpacity={0.5}
        underlayColor='#eb6c3a'
        style={[styles.pickerButton, focusedControl===label ? styles.focusedControl : null]}
        onPress={handleOnPress}
        accessibilityElementsHidden={visible}>
        <View
          style={[{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'black',
            width: '100%'
          }]}>
          <Text style={styles.buttonText}>{label}</Text>
          <Image source={assets.picker} resizeMode="contain" style={styles.img} />
        </View>
      </TouchableHighlight>
      {renderDropdown()}</>
  );
};

const styles = EStyleSheet.create({
  customPicker: {
    position: 'fixed',
    width: '60%',
    height: '70vh',
    top: '10%',
    left: '20%',
    backgroundColor: 'black',
    zIndex: 999999,
    '@media android': {
      position: 'absolute',
      height: 375,
      width: Platform.isTV ? '60%' : '100%',
      top: Platform.isTV ? -350 : 0,
      left: Platform.isTV ? '20%' : '2.8%',
    },
    '@media ios': {
      position: 'absolute',
      height: 500,
      width: Platform.isTV ? '60%' : '100%',
      top: Platform.isTV ? -750 : -280,
      left: Platform.isTV ? '20%' : '2.8%'
    },
  },
  img: {
    width: 20,
    height: 20,
    '@media ios': {
      width: Platform.isTV ? 15 : 20,
      height: Platform.isTV ? 15 : 20,
    },
    '@media android': {
      width: Platform.isTV ? 15 : 20,
      height: Platform.isTV ? 15 : 20,
    },
  },
  focusedControl: {
    borderColor: 'white',
    borderWidth: 2,
  },
  focusedItem: {
    backgroundColor: 'steelblue',
  },
  pickerButton: {
    height: 'auto',
    backgroundColor: '#efefef',
    zIndex: 1,
    fontSize: 12,
    width: isMobileWeb() ? '30%' : '7%',
    marginRight: 5,
    marginLeft: 5,
    '@media ios': {
      fontSize: 10,
      flexDirection: 'row',
      width: Platform.isTV ? '8%' : '30%',
      marginTop: Platform.isTV ? 1 : 5
    },
    '@media android': {
      fontSize: 10,
      flexDirection: 'row',
      width: Platform.isTV ? '8%' : '30%',
      marginTop: Platform.isTV ? 1 : 5
    },
    '@media web': {
      marginTop: isMobileWeb() ? 5 : 0
    }
  },
  buttonText: {
    flex: 1,
    padding: 5,
    width: '100%',
    color: 'white',
    '@media ios': {
      fontSize: 10,
    },
    '@media android': {
      fontSize: 10,
    },
  },
  arrowIndicator: {
    paddingRight: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  listText: {
    paddingLeft: 10,
    paddingBottom: 10,
    paddingTop: 10,
    color: 'white'
  },
  icon: {
    marginRight: 10,
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'white'
  },
  smallCenterDropdown: {
    width: '30%',
    top: '50%',
    borderWidth: 5,
    borderStyle: 'solid',
    borderColor: 'grey',
    '@media ios': {
      height: '80%',
      width: '80%',
      top: '10%',
    },
    '@media android': {
      height: '80%',
      width: '80%',
      top: '10%',
    },
  },
});

export default CustomPicker;
