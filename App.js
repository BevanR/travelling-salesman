import React from 'react'
import {Button, StyleSheet, Text, TextInput, View} from 'react-native'
import MapView from 'react-native-maps'
import * as uuid from 'uuid'
import * as qs from 'qs'

// noinspection JSUnusedGlobalSymbols
export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.session = uuid.v4()
    this.googleApiKey = process.env.GOOGLE_API_KEY

    this.state = {
      results: [],
      destinations: [],
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
    const {results, destinations, latitude, longitude, latitudeDelta, longitudeDelta} = this.state

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

        {(results.length > 0) && <View style={styles.places}>
          {results.map(item => (
            <View key={item.id} style={styles.place}>
              {/* TODO Make a round button */}
              <Button
                title="+"
                onPress={() => this.addDestinationFromGooglePlacesAPI(item)}
              />

              <View style={styles.placeText}>
                <Text>{item.label}</Text>
                <Text style={styles.placeSubtext}>{item.subtext}</Text>
              </View>
            </View>
          ))}
        </View>}

        {(results.length < 1 && destinations.length > 0) && <View style={styles.places}>
          {destinations.map((item, index) => (
            <View key={item.id} style={styles.place}>
              <Text>({index + 1})</Text>

              <View style={styles.placeText}>
                <Text>{item.label}</Text>
                <Text style={styles.placeSubtext}>{item.subtext}</Text>
              </View>
            </View>
          ))}
        </View>}
      </View>
    )
  }

  search(query) {
    this.setState({results: []})

    if (query.length) {
      // TODO Handle race conditions when some responses are slow.
      // Google responses are consistently fast, so it is difficult to reproduce race conditions.
      this.requestPlaces(query).then(results => this.setState({results}))
    }
  }

  addDestination(coordinates, label, subtext) {
    this.setState({
      results: [],
      destinations: [...this.state.destinations, {coordinates, label, subtext}],
    })
  }

  addDestinationFromGooglePlacesAPI({id, label, subtext}) {
    this.requestPlace(id).then(coordinates => this.addDestination(coordinates, label, subtext))
  }

  requestPlaces(query) {
    const parameters = {
      input: query,
      // TODO Include offset for text caret.

      // Prefer locations close to current map location.
      location: this.llString,

      // Use the map's height as a measure of "close".
      radius: 10000 * this.state.latitudeDelta,
    }

    return this.googlePlacesAPIRequest('autocomplete', parameters)
      .then(data => data['predictions'].map(prediction => {
        const {place_id: id, structured_formatting: {main_text: label, secondary_text: subtext}} = prediction
        return {id, label, subtext}
      }))
  }

  requestPlace(id) {
    const parameters = {
      placeid: id,
      fields: 'geometry',
    }

    return this.googlePlacesAPIRequest('details', parameters).then(data => {
      const {lat, lon} = data.result['geometry'].location
      return {
        latitude: lat,
        longitude: lon,
      }
    })
  }

  googlePlacesAPIRequest(resource, parameters) {
    // Keys for API rate limiting.
    parameters.key = this.googleApiKey
    parameters.sessiontoken = this.session
    const query = qs.stringify(parameters)

    return fetch(`https://maps.googleapis.com/maps/api/place/${resource}/json?${query}`)
      .then(response => response.json())
      .then(data => data.status === 'OK'
        ? data
        : alert('Sorry. Something went wrong. You could try restarting the app.'),
      )

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
  places: {
    backgroundColor: 'white',
    position: 'absolute',
    top: 100,
    width: '100%',
    borderTopWidth: 1,
    borderColor: 'black',
  },
  place: {
    borderBottomWidth: 1,
    borderColor: 'black',
    padding: 5,
    flexDirection: 'row',
  },
  placeSubtext: {
    fontSize: 10,
    color: 'grey',
  },
  placeText: {
    paddingLeft: 5,
  },
})
