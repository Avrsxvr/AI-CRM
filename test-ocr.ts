import { CardOcrAgent } from './src/lib/agents/cardOcr';

async function runTest() {
  // 1x1 transparent png base64
  const dummyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  console.log('Testing CardOcrAgent with dummy image...');
  try {
    const result = await CardOcrAgent.processCard(dummyImage, 'image/png');
    console.log('Success Result:', result);
  } catch (error) {
    console.error('Test Failed Exception:', error);
  }
}

runTest();
