import { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Appearance,
  useColorScheme,
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import * as SQLite from "expo-sqlite"

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase()

function Items({ done: doneHeading, onPressItem }) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items where done = ?;`,
        [doneHeading ? 1 : 0],
        (_, {rows: { _array }}) => setItems(_array)
      )
    })
  }, [])
  const heading = doneHeading ? "Completed" : "To Do"

  if (items === null || items.length === 0) return null
  else return (
    <View style={[]}>
      <Text style={[]}>{ heading }</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onPressItem && onPressItem(item.id)}
          style={{
            backgroundColor: item.done ? "#1c9963" : "#fff",
            borderColor: "#000",
            borderWidth: 1,
            padding: 8,
          }}
        >
          <Text style={{ color: item.done ? "#fff" : "#000" }}>{item.value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function App() {
  let colorScheme = useColorScheme()
  const [text, setText] = useState(null)
  const [forceUpdate, forceUpdateId] = useForceUpdate()

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `create table if not exists items (
          id integer primary key not null,
          done int,
          value text
        );`
      )
    })
  }, [])

  const add = (text) => {
    if (text === null || text === '') {
      return false
    } else {
      db.transaction(
        (tx) => {
          tx.executeSql('insert into items (done, value) values (0, ?)', [text])
          tx.executeSql('select * from items', [], (_, { rows }) => {
            console.log(JSON.stringify(rows))
          })
        },
        null,
        forceUpdate
      )
    }
  }

  const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer
  const themeTextStyle = colorScheme === 'light' ? styles.lightText : styles.darkText

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <Text style={[themeTextStyle]}>SQLite Example</Text>
      { Platform.OS === 'web' ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
        <View style={styles.flexRow}>
          <TextInput
            onChangeText={(text) => setText(text)}
            onSubmitEditing={() => {
              add(text)
              setText(null)
            }}
            placeholder={'What do you need to do?'}
            style={styles.input}
            value={text}
          />
        </View>
        <ScrollView style={styles.listArea}>
          <Items
            key={`forceupdate-todo-${forceUpdateId}`}
            done={false}
            onPressItem={(id) => {
              db.transaction(
                (tx) => {
                  tx.executeSql(`update items set done = 1 where id = ?;`, [id])
                },
                null,
                forceUpdate
              )
            }}
          />
          <Items
            key={`forceupdate-done-${forceUpdateId}`}
            done
            onPressItem={(id) => {
              db.transaction(
                (tx) => {
                  tx.executeSql(`delete from items where id = ?;`, [id])
                },
                null,
                forceUpdate
              )
            }}
          />
        </ScrollView>
        </>
      ) }
      <StatusBar style="auto" />
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0)
  return [() => setValue(value + 1), value]
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    color: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightContainer: {
    backgroundColor: '#e8f1f2'
  },
  lightText: {
    color: '#100007'
  },
  darkContainer: {
    backgroundColor: '#100007'
  },
  darkText: {
    color: '#e8f1f2'
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
  listArea: {
    backgroundColor: "#f0f0f0",
    flex: 1,
    paddingTop: 16,
  },
});
