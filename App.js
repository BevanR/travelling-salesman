import React from 'react'
import {StyleSheet, View} from 'react-native'
import {SearchBar} from 'react-native-elements'
import MapView from 'react-native-maps'

export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      deviceLocation: {},
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {latitude, longitude} = position.coords
        return this.setState({
          deviceLocation: {latitude, longitude},
        })
      },
      (error) => alert(error.message),
      {
        // enableHighAccuracy: true,
        // timeout: 20000,
        maximumAge: 100000,
      },
    )
  }

  render() {
    const {latitude, longitude} = this.state.deviceLocation
    const delta = 0.05
    const region = {latitude, longitude, latitudeDelta: delta, longitudeDelta: delta}

    return (
      <View style={styles.container}>
        {
          latitude && <MapView style={styles.map} initialRegion={region}/>
        }

        <SearchBar placeholder="Search here" style={styles.search} containerStyle={styles.searchContainer}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  search: {
    position: 'absolute',
    top: 35,
    left: 10,
    right: 10,
    height: 50,
    padding: 10,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
})
