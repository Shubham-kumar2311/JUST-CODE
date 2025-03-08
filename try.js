const { MongoClient } = require('mongodb');

// MongoDB connection URI (use IPv4 explicitly)
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'leet-code';
const collectionName = 'problems';

const problemData = {
  id: 1,
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "Easy",
  description: "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
  examples: [
    { input: "nums = [2,7,11,15], target = 9", output: "[0, 1]" },
    { input: "nums = [3,2,4], target = 6", output: "[1, 2]" },
  ],
  constraints: "Each input would have exactly one solution, and you may not use the same element twice.",
  run_test: [
    { input: [4, 2, 7, 11, 15, 9], output: "0 1" },
    { input: [3, 3, 2, 4, 6], output: "1 2" }
  ]
};

async function insertProblem() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Use replaceOne with upsert to overwrite if exists, or insert if not
    const result = await collection.replaceOne(
      { id: problemData.id }, // Filter to match existing document by 'id'
      problemData,            // Replacement document
      { upsert: true }        // Insert if no match found
    );

    if (result.matchedCount > 0) {
      console.log(`Replaced existing problem with id: ${problemData.id}`);
    } else {
      console.log(`Inserted new problem with id: ${problemData.id}`);
    }
    console.log(`Modified count: ${result.modifiedCount}, Upserted ID: ${result.upsertedId}`);
  } catch (err) {
    console.error('Error inserting/updating problem:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

insertProblem();