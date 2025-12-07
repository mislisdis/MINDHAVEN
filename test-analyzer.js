const journalAnalyzer = require('./src/modules/journalAnalyzer');

async function test() {
  const testText = "I feel happy and grateful today. I had a great day at work and finished an important project. I'm looking forward to spending time with my family this weekend.";
  
  console.log('Testing analyzer with text:', testText);
  const result = await journalAnalyzer.analyzeEntry(testText);
  
  console.log('\nAnalysis Result:');
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);