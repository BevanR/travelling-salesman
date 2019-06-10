import React from 'react'
import {StyleSheet, Text, TextInput, View, Button} from 'react-native'
import MapView from 'react-native-maps'
import * as uuid from 'uuid'
import * as qs from 'qs'

export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.session = uuid.v4()
    this.googleApiKey = 'AIzaSyDFZZaK5LSTrR6kJ03CjIn0DoOAGT5C6fA'

    this.state = {
      results: [],
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {latitude, longitude} = position.coords
        const delta = 0.05
        return this.setState({latitude, longitude, latitudeDelta: delta, longitudeDelta: delta})
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
    const {results, latitude, longitude, latitudeDelta, longitudeDelta} = this.state

    return (
      <View style={styles.container}>
        {latitude && <MapView
          style={styles.map}
          initialRegion={{latitude, longitude, latitudeDelta, longitudeDelta}}
          onRegionChange={({latitude, longitude, latitudeDelta, longitudeDelta}) => this.setState({
            latitude,
            longitude,
            latitudeDelta,
            longitudeDelta,
          })}
        />}

        <TextInput
          placeholder="🔍 Search here"
          style={styles.search}
          returnKeyType='search'
          onChangeText={query => this.search(query)}
        />

        {(results.length > 0) && <View style={styles.results}>
          {results.map(item => (
            <View key={item.id} style={styles.resultItem}>
              {/* TODO Make a round button */}
              <Button
                title="+"
                onPress={() => console.log('pressed', item.id)}
              />

              <View style={styles.resultText}>
                <Text>{item.label}</Text>
                <Text style={styles.resultSubtext}>{item.subtext}</Text>
              </View>
            </View>
          ))}
        </View>}
      </View>
    )
  }

  search(query) {
    this.requestPlaces(query).then(results => this.setState({results}))
  }

  requestPlaces(query) {
    const parameters = {
      input: query,
      // TODO Include offset for text caret.

      // Prefer locations close to current map location.
      location: this.llString,

      // Use the map's height as a measure of "close".
      radius: 10000 * this.state.latitudeDelta,

      // Keys for API rate limiting.
      key: this.googleApiKey,
      sessiontoken: this.session,
    }
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' + qs.stringify(parameters)

    return fetch(url)
      .then(response => response.json())
      .then(data => data.predictions.map(prediction => {
        // console.log(prediction)
        const {id, structured_formatting: {main_text: label, secondary_text: subtext}} = prediction
        return {id, label, subtext}
      }))
  }

  get llString() {
    const {latitude, longitude} = this.state
    return latitude ? latitude + ',' + longitude : ''
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
    padding: 3,
    borderWidth: 1,
    borderColor: 'grey',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  results: {
    backgroundColor: 'white',
    position: 'absolute',
    top: 100,
    width: '100%',
    borderTopWidth: 1,
    borderColor: 'black',
  },
  resultItem: {
    borderBottomWidth: 1,
    borderColor: 'black',
    padding: 5,
    flexDirection: 'row',
  },
  resultSubtext: {
    fontSize: 10,
    color: 'grey',
  },
  resultText: {
    paddingLeft: 5,
  },
})
