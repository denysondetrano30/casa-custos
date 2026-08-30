// Conexão com o Firebase — criado na conta do Firebase de vocês.
// A "apiKey" aqui NÃO é segredo: mesmo depois de publicado no site,
// qualquer pessoa consegue ver esse arquivo. Quem protege os dados de
// verdade são as regras do Firestore (banco de dados), não essa chave.
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_qfvfuP8Bbk1HBsZd0_qMB9_lUmjfXA8",
  authDomain: "casa-custos-denyson.firebaseapp.com",
  projectId: "casa-custos-denyson",
  storageBucket: "casa-custos-denyson.firebasestorage.app",
  messagingSenderId: "98511857749",
  appId: "1:98511857749:web:4c0b1b902ace910c218cdc",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
