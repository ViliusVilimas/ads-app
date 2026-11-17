import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Button, FlatList, TouchableOpacity,
  Image, Alert, Animated, ScrollView, Platform,
} from 'react-native';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  collection, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppContext } from './Context';

const CATEGORIES = ['Computers', 'Books', 'Cars'];

const inputStyle = (c) => ({
  borderWidth: 1, borderColor: c.accent, color: c.fg, padding: 8, marginBottom: 8,
});

/* ---------------- LIST SCREEN ---------------- */
export function ListScreen({ navigation }) {
  const { c, user, toggle, dark } = useContext(AppContext);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState(null);
  const [mine, setMine] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'ads'));
    setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => navigation.addListener('focus', load), [navigation]);

  // ANIMATION: theme button pops when pressed
  const onToggle = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    toggle();
  };

  const seed = async () => {
    const data = [
      ['Laptop', 800, 'Computers'], ['Monitor', 150, 'Computers'], ['Keyboard', 40, 'Computers'],
      ['Novel', 10, 'Books'], ['Cookbook', 15, 'Books'], ['Textbook', 30, 'Books'],
      ['Old Golf', 2000, 'Cars'], ['Small Fiat', 1500, 'Cars'], ['Van', 5000, 'Cars'],
    ];
    for (const [title, price, category] of data) {
      await addDoc(collection(db, 'ads'), {
        title, price, category, description: 'Sample ' + title,
        image1: `https://picsum.photos/seed/${title}1/300`,
        image2: `https://picsum.photos/seed/${title}2/300`,
        authorId: user.uid, authorName: user.displayName || user.email,
      });
    }
    load();
  };

  const shown = ads
    .filter((a) => !cat || a.category === cat)
    .filter((a) => !mine || (user && a.authorId === user.uid));

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Button title={dark ? 'Light' : 'Dark'} onPress={onToggle} />
        </Animated.View>
        {user ? (
          <Button title="Logout" onPress={() => signOut(auth)} />
        ) : (
          <Button title="Login" onPress={() => navigation.navigate('Auth')} />
        )}
      </View>

      {user && (
        <View>
          <Button title="New ad" onPress={() => navigation.navigate('Form')} />
          <Button title="Seed 9 sample ads" onPress={seed} />
          <Button title={mine ? 'Showing: My ads (tap for All)' : 'Showing: All ads (tap for Mine)'} onPress={() => setMine(!mine)} />
        </View>
      )}

      <View style={{ flexDirection: 'row', marginVertical: 8 }}>
        {[null, ...CATEGORIES].map((k) => (
          <TouchableOpacity key={k || 'all'} onPress={() => setCat(k)} style={{ marginRight: 12 }}>
            <Text style={{ color: cat === k ? c.accent : c.fg, fontWeight: cat === k ? 'bold' : 'normal' }}>
              {k || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={{ color: c.fg }}>Loading...</Text>
      ) : shown.length === 0 ? (
        <Text style={{ color: c.fg }}>No ads found.</Text>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Detail', { ad: item })}
              style={{ backgroundColor: c.card, padding: 12, marginBottom: 8 }}
            >
              <Text style={{ color: c.fg, fontSize: 16 }}>{item.title}</Text>
              <Text style={{ color: c.fg }}>{item.price} €</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

/* ---------------- DETAIL SCREEN ---------------- */
export function DetailScreen({ route, navigation }) {
  const { c, user } = useContext(AppContext);
  const { ad } = route.params;
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    getDoc(doc(db, 'users', ad.authorId)).then((s) => setAuthor(s.data()));
  }, []);

  const doDelete = async () => {
    await deleteDoc(doc(db, 'ads', ad.id));
    navigation.goBack();
  };

  // Alert.alert does nothing on web, so use window.confirm there
  const remove = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this ad?')) doDelete();
    } else {
      Alert.alert('Delete ad?', 'This cannot be undone.', [
        { text: 'Cancel' },
        { text: 'Delete', onPress: doDelete },
      ]);
    }
  };

  const isOwner = user && user.uid === ad.authorId;

  return (
    <ScrollView style={{ padding: 10, backgroundColor: c.bg }}>
      <Text style={{ color: c.fg, fontSize: 22 }}>{ad.title}</Text>
      <Text style={{ color: c.fg }}>{ad.price} € — {ad.category}</Text>
      <Text style={{ color: c.fg, marginVertical: 8 }}>{ad.description}</Text>
      <Image source={{ uri: ad.image1 }} style={{ width: 200, height: 200, marginBottom: 8 }} />
      <Image source={{ uri: ad.image2 }} style={{ width: 200, height: 200, marginBottom: 8 }} />
      <Text style={{ color: c.fg }}>
        Author: {author ? `${author.name} (${author.email})` : '...'}
      </Text>
      {isOwner && (
        <View style={{ marginTop: 10 }}>
          <Button title="Edit" onPress={() => navigation.navigate('Form', { ad })} />
          <Button title="Delete" color="red" onPress={remove} />
        </View>
      )}
    </ScrollView>
  );
}

/* ---------------- CREATE / EDIT SCREEN ---------------- */
export function FormScreen({ route, navigation }) {
  const { c, user } = useContext(AppContext);
  const ad = route.params?.ad;
  const [f, setF] = useState({
    title: ad?.title || '', price: ad ? String(ad.price) : '',
    category: ad?.category || CATEGORIES[0], description: ad?.description || '',
    image1: ad?.image1 || '', image2: ad?.image2 || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const save = async () => {
    if (!f.title || !f.price || !f.description || !f.image1 || !f.image2) {
      setError('All fields are required (2 image URLs).');
      return;
    }
    setError('');
    setSaving(true);
    const data = { ...f, price: Number(f.price) };
    if (ad) {
      await updateDoc(doc(db, 'ads', ad.id), data);
    } else {
      await addDoc(collection(db, 'ads'), {
        ...data, authorId: user.uid, authorName: user.displayName || user.email,
      });
    }
    navigation.popToTop();
  };

  return (
    <ScrollView style={{ padding: 10, backgroundColor: c.bg }}>
      {['title', 'price', 'description', 'image1', 'image2'].map((k) => (
        <TextInput
          key={k} placeholder={k} placeholderTextColor="gray" value={f[k]}
          onChangeText={set(k)} style={inputStyle(c)}
          keyboardType={k === 'price' ? 'numeric' : 'default'}
        />
      ))}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {CATEGORIES.map((k) => (
          <TouchableOpacity key={k} onPress={() => set('category')(k)} style={{ marginRight: 12 }}>
            <Text style={{ color: f.category === k ? c.accent : c.fg, fontWeight: f.category === k ? 'bold' : 'normal' }}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Button title={saving ? 'Saving...' : 'Save'} onPress={save} disabled={saving} />
    </ScrollView>
  );
}

/* ---------------- LOGIN / REGISTER SCREEN ---------------- */
export function AuthScreen({ navigation }) {
  const { c } = useContext(AppContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const login = () => {
    setBusy(true);
    signInWithEmailAndPassword(auth, email, pw)
      .then(() => navigation.goBack())
      .catch((e) => { setError(e.message); setBusy(false); });
  };

  const register = () => {
    setBusy(true);
    createUserWithEmailAndPassword(auth, email, pw)
      .then((cred) => setDoc(doc(db, 'users', cred.user.uid), { name, email }))
      .then(() => navigation.goBack())
      .catch((e) => { setError(e.message); setBusy(false); });
  };

  return (
    <View style={{ padding: 10, backgroundColor: c.bg, flex: 1 }}>
      <TextInput placeholder="Name (register only)" placeholderTextColor="gray" value={name} onChangeText={setName} style={inputStyle(c)} />
      <TextInput placeholder="Email" placeholderTextColor="gray" value={email} onChangeText={setEmail} autoCapitalize="none" style={inputStyle(c)} />
      <TextInput placeholder="Password" placeholderTextColor="gray" value={pw} onChangeText={setPw} secureTextEntry style={inputStyle(c)} />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Button title={busy ? 'Please wait...' : 'Login'} onPress={login} disabled={busy} />
      <Button title="Register" onPress={register} disabled={busy} />
    </View>
  );
}
