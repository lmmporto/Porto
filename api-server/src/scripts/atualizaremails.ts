import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Carrega o .env
dotenv.config();

const users = [
    { name: "Bruno Ocampos Rezende", email: "bruno.rezende@nibo.com.br" },
    { name: "Abner Christófori", email: "abner.christofori@nibo.com.br" },
    { name: "Bento Vargas", email: "bento.vargas@nibo.com.br" },
    { name: "Italo Felipe Maglia Xavier", email: "italo.xavier@nibo.com.br" },
    { name: "Janaina Almeida Costa", email: "jana.almeida@nibo.com.br" },
    { name: "Gabriel Rauédys", email: "gabriel.rauedys@nibo.com.br" },
    { name: "Sabrina Forte", email: "sabrina.forte@nibo.com.br" },
    { name: "Jefferson Gomes Donato", email: "jefferson.donato@nibo.com.br" },
    { name: "Victor Silva", email: "victor.silva@nibo.com.br" },
    { name: "Isabella Silva Eduardo", email: "isabella.silva@nibo.com.br" },
    { name: "Bruna Mesquita", email: "bruna.mesquita@nibo.com.br" },
    { name: "Ana Julia Cecchin", email: "ana.cecchin@nibo.com.br" },
    { name: "Vitória Ferraz", email: "vitoria.ferraz@nibo.com.br" },
    { name: "Camila Lima dos Santos", email: "camila.lima@nibo.com.br" },
    { name: "Anna Clara Machado Martins", email: "anna.clara@nibo.com.br" },
    { name: "Dayane Natividade", email: "dayane.natividade@nibo.com.br" },
    { name: "Amaranta Vieira", email: "amaranta.vieira@nibo.com.br" },
    { name: "Gustavo Maciel", email: "gustavo.maciel@nibo.com.br" },
    { name: "Bruno Almeida da Silva", email: "bruno.dasilva@nibo.com.br" },
    { name: "Eduarda Araujo", email: "eduarda.araujo@nibo.com.br" },
    { name: "Priscila Santos", email: "priscila.santos@nibo.com.br" },
    { name: "Larissa Silva", email: "larissa.silva@nibo.com.br" },
    { name: "Mariana Freitas", email: "mariana.freitas@nibo.com.br" },
    { name: "Fernanda Silva", email: "fernanda.silva@nibo.com.br" },
    { name: "Nicoly Lima", email: "nicoly.lima@nibo.com.br" },
    { name: "Eduarda Scheidegger", email: "eduarda.scheidegger@nibo.com.br" },
    { name: "Maria Eduarda Lenini", email: "mariaeduarda.lenini@nibo.com.br" },
    { name: "Luiz Felipe de Mello", email: "luiz.mello@nibo.com.br" },
    { name: "Laisa Santana dos Santos", email: "laisa.santana@nibo.com.br" },
    { name: "Vanessa Oliveira Silva", email: "vanessa.oliveira@nibo.com.br" },
    { name: "Talita Coutinho", email: "talita.coutinho@nibo.com.br" },
    { name: "Douglas Castro", email: "douglas.castro@nibo.com.br" },
    { name: "Thayná Sousa", email: "thayna.sousa@nibo.com.br" },
    { name: "Ana Cibelle Araujo Rocha", email: "cibelle.araujo@nibo.com.br" },
    { name: "Camilla Nunes", email: "camilla.nunes@nibo.com.br" },
    { name: "Sarah Jordanna", email: "sarah.jordanna@nibo.com.br" },
    { name: "Mateus Francisco Braga", email: "mateus.braga@nibo.com.br" },
    { name: "Andriel Mateus de Oliveira", email: "andriel.mateus@nibo.com.br" },
    { name: "Lucas Natali", email: "lucas.natali@nibo.com.br" },
    { name: "Elder Fernando Dos Santos", email: "elder.fernando@nibo.com.br" },
    { name: "Yan Menegati Martins", email: "yan.menegati@nibo.com.br" },
    { name: "Gabriel Pavao de Andrade", email: "gabriel.pavao@nibo.com.br" }
];

async function upload() {
    try {
        // Lê o JSON direto da variável de ambiente
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
        
        initializeApp({
            credential: cert(serviceAccount)
        });

        const db = getFirestore();
        const collectionRef = db.collection('sdr_registry');

        console.log("⏳ Iniciando upload em lote...");
        const batch = db.batch();

        users.forEach((user) => {
            const docRef = collectionRef.doc(user.email); // Usa o email como ID para evitar duplicatas
            batch.set(docRef, {
                name: user.name,
                email: user.email,
                createdAt: new Date().toISOString()
            });
        });

        await batch.commit();
        console.log("✅ Sucesso! Os registros estão no Firestore.");
        process.exit(0);
    } catch (error) {
        console.error("🛑 Erro ao subir dados:", error);
        process.exit(1);
    }
}

upload();

// execute com: pnpm tsx src/scripts/atualizaremails.ts
