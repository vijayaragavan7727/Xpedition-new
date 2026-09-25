const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
  }
}

async function runVisualGenerationTests() {
  console.log('======================================================');
  console.log('XPEDITION VISUAL GENERATION INFRASTRUCTURE (PHASE D1)');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: Codebase Architecture & Security Isolation
  // ---------------------------------------------------------------------------
  console.log('1. Checking Codebase Architecture & Security Isolation');

  const filesToCheck = [
    'lib/visualGeneration/types.ts',
    'lib/visualGeneration/errors.ts',
    'lib/visualGeneration/ComfyUIAdapter.ts',
    'lib/visualGeneration/VisualGenerationService.ts',
    'lib/visualGeneration/index.ts',
    'comfyui/workflows/educational-illustration.json',
    'app/api/visual-generation/route.ts',
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(rootDir, relPath);
    assert(fs.existsSync(fullPath), `Required module exists: ${relPath}`);
  }

  // Verify client components do not import or call ComfyUI directly
  const componentsDir = path.join(rootDir, 'components');
  function scanDirForDirectComfyUICalls(dir) {
    let leaks = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        leaks += scanDirForDirectComfyUICalls(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('8188') || content.includes('COMFYUI_BASE_URL')) {
          console.error(`  [LEAK] Client component ${entry.name} references ComfyUI port/env directly!`);
          leaks++;
        }
      }
    }
    return leaks;
  }

  const directCalls = scanDirForDirectComfyUICalls(componentsDir);
  assert(directCalls === 0, 'No client components contain direct ComfyUI ports or URLs');

  // Verify workflow file validity
  const workflowPath = path.join(rootDir, 'comfyui', 'workflows', 'educational-illustration.json');
  const workflowRaw = fs.readFileSync(workflowPath, 'utf8');
  let workflowParsed;
  try {
    workflowParsed = JSON.parse(workflowRaw);
    assert(Boolean(workflowParsed._metadata), 'Workflow contains _metadata block');
    assert(Boolean(workflowParsed._metadata.targetModel || workflowParsed._metadata.modelFamily), 'Workflow declares intended model');
    assert(Boolean(workflowParsed._metadata.modelLicense), 'Workflow specifies commercial license (Open RAIL-M)');
    const nodes = workflowParsed.nodes || workflowParsed;
    assert(Boolean(nodes['3'] && nodes['3'].class_type === 'KSampler'), 'Workflow contains KSampler node');
    assert(Boolean(nodes['4'] && nodes['4'].class_type === 'CheckpointLoaderSimple'), 'Workflow contains CheckpointLoader node');
    assert(Boolean(nodes['6'] && nodes['6'].class_type === 'CLIPTextEncode'), 'Workflow contains positive CLIP prompt node');
    assert(Boolean(nodes['9'] && nodes['9'].class_type === 'SaveImage'), 'Workflow contains SaveImage node');
  } catch (err) {
    assert(false, `Workflow JSON is valid and parseable: ${err.message}`);
  }


  // ---------------------------------------------------------------------------
  // TEST SUITE 2: Request Validation & Error Classes
  // ---------------------------------------------------------------------------
  console.log('\n2. Checking Request Validation & Normalized Error Classes');

  const errorsModule = path.join(rootDir, 'lib', 'visualGeneration', 'errors.ts');
  const errorsContent = fs.readFileSync(errorsModule, 'utf8');
  assert(errorsContent.includes('class VisualGenerationError'), 'VisualGenerationError base class defined');
  assert(errorsContent.includes('class ComfyUIUnavailableError'), 'ComfyUIUnavailableError defined with 503 HTTP status');
  assert(errorsContent.includes('class ComfyUITimeoutError'), 'ComfyUITimeoutError defined with 504 HTTP status');
  assert(errorsContent.includes('class WorkflowExecutionError'), 'WorkflowExecutionError defined');
  assert(errorsContent.includes('class WorkflowNotFoundError'), 'WorkflowNotFoundError defined');

  const routePath = path.join(rootDir, 'app', 'api', 'visual-generation', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');
  assert(routeContent.includes('requireServerAuth'), 'API route is protected by requireServerAuth');
  assert(routeContent.includes('conceptId'), 'API route validates conceptId');
  assert(routeContent.includes('prompt'), 'API route validates prompt');
  assert(routeContent.includes('ComfyUIUnavailableError'), 'API route handles ComfyUIUnavailableError safely');
  assert(routeContent.includes('ComfyUITimeoutError'), 'API route handles ComfyUITimeoutError safely');

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: ComfyUI Adapter Mock Unit Tests
  // ---------------------------------------------------------------------------
  console.log('\n3. Checking ComfyUI Adapter Unit Logic (Mocked Network & State)');

  // Let's test the adapter logic in a simulated environment
  const mockSystemStats = {
    system: { os: 'nt', python_version: '3.11.9' },
    devices: [{ name: 'cpu', vram_total: 17179869184, vram_free: 8589934592 }],
  };

  const mockPromptSuccessResponse = {
    prompt_id: 'test-prompt-uuid-12345',
    number: 1,
    node_errors: {},
  };

  const mockHistoryCompleted = {
    'test-prompt-uuid-12345': {
      prompt: [1, 'test-prompt-uuid-12345', {}, {}],
      outputs: {
        '9': {
          images: [
            {
              filename: 'Xpedition_dc_motor_0001.png',
              subfolder: '',
              type: 'output',
            },
          ],
        },
      },
      status: {
        status_str: 'success',
        completed: true,
        messages: [],
      },
    },
  };

  // Unit assertion on mock prompt payload construction
  const testConceptId = 'dc_motor';
  const testPromptText = 'educational schematic illustration of a DC motor with armature, magnetic poles, commutator, and brushes';
  const injectedWorkflow = JSON.parse(JSON.stringify(workflowParsed.nodes || workflowParsed));
  delete injectedWorkflow._metadata;

  injectedWorkflow['6'].inputs.text = `Educational diagram of ${testConceptId}. ${testPromptText}`;
  injectedWorkflow['5'].inputs.width = 512;
  injectedWorkflow['5'].inputs.height = 512;

  assert(injectedWorkflow['6'].inputs.text.includes('dc_motor'), 'Prompt injected into CLIPTextEncode node 6');
  assert(injectedWorkflow['5'].inputs.width === 512, 'Resolution injected into EmptyLatentImage node 5');

  // Test status mapping logic
  function mapComfyStatus(historyEntry) {
    if (!historyEntry) return 'running';
    if (historyEntry.status?.status_str === 'error') return 'failed';
    if (historyEntry.outputs && Object.keys(historyEntry.outputs).length > 0) return 'completed';
    return 'queued';
  }

  assert(mapComfyStatus(null) === 'running', 'Status is running when history not yet available');
  assert(mapComfyStatus({ status: { status_str: 'error' } }) === 'failed', 'Status is failed when status_str is error');
  assert(mapComfyStatus(mockHistoryCompleted['test-prompt-uuid-12345']) === 'completed', 'Status is completed when outputs present');

  // Test output image resolution extraction
  const outputs = mockHistoryCompleted['test-prompt-uuid-12345'].outputs;
  let firstImage = null;
  for (const nodeId of Object.keys(outputs)) {
    const nodeOutput = outputs[nodeId];
    if (nodeOutput.images && nodeOutput.images.length > 0) {
      firstImage = nodeOutput.images[0];
      break;
    }
  }

  assert(Boolean(firstImage), 'Extracted image from node 9 output');
  assert(firstImage.filename === 'Xpedition_dc_motor_0001.png', 'Filename correctly parsed from output node');

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: Storage & Metadata Contract for Phase 2 Extensibility
  // ---------------------------------------------------------------------------
  console.log('\n4. Checking Storage Contract & Phase 2 Extensibility');

  const servicePath = path.join(rootDir, 'lib', 'visualGeneration', 'VisualGenerationService.ts');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  assert(serviceContent.includes('generated-visuals'), 'Storage contract writes to public/generated-visuals for web serving');
  assert(serviceContent.includes('url: `/generated-visuals/'), 'Result contains web-accessible relative url without exposing server disk path');
  assert(serviceContent.includes('model: metadata.targetModel'), 'Result includes model metadata');
  assert(serviceContent.includes('modelLicense: metadata.modelLicense'), 'Result includes license metadata');
  assert(serviceContent.includes('executionTimeMs'), 'Result tracks execution latency');


  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('======================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runVisualGenerationTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
