const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Determine a base temporary directory. Fallback to /tmp if app/tmp doesn't exist
const BASE_TMP_DIR = path.join(__dirname, '..', '..', 'tmp');
if (!fs.existsSync(BASE_TMP_DIR)) {
  fs.mkdirSync(BASE_TMP_DIR, { recursive: true });
}

/**
 * Compiles a LaTeX string into a PDF using pdflatex safely.
 *
 * @param {string} latexCode - The raw LaTeX source code
 * @returns {Promise<{ success: boolean, pdfBuffer?: Buffer, logs?: string }>}
 */
async function compileLatexToPdf(latexCode) {
  // Generate a unique identifier for this compilation job to prevent collisions
  const jobId = crypto.randomUUID();
  const workDir = path.join(BASE_TMP_DIR, jobId);

  // File paths inside the isolated working directory
  const texFilePath = path.join(workDir, `${jobId}.tex`);
  const logFilePath = path.join(workDir, `${jobId}.log`);
  const pdfFilePath = path.join(workDir, `${jobId}.pdf`);

  try {
    // 1. Create the isolated working directory
    await fs.promises.mkdir(workDir, { recursive: true });

    // 2. Write the LaTeX code to a .tex file
    await fs.promises.writeFile(texFilePath, latexCode, 'utf8');

    // 3. Spawn the pdflatex process
    // SECURITY: Use 'spawn' with strict arguments instead of 'exec'
    // -interaction=nonstopmode: Don't pause and wait for user input on errors
    // -halt-on-error: Stop compilation immediately if an error occurs
    // -no-shell-escape: Strictly forbid \write18 or system() calls from inside the LaTeX code
    // -output-directory: Direct all generated files (.aux, .log, .pdf) here
    const pdflatexArgs = [
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-no-shell-escape',
      `-output-directory=${workDir}`,
      texFilePath,
    ];

    await new Promise((resolve, reject) => {
      // Set a strict timeout to prevent infinite loops (e.g., deeply recursive macros)
      // LaTeX compilation for a 1-page resume usually takes < 2 seconds. We'll allow 10s.
      const child = spawn('pdflatex', pdflatexArgs, { timeout: 10000 });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          // Reject with stdout/stderr so we know what failed
          reject(new Error(`pdflatex exited with code ${code}.\nStdout: ${stdout}\nStderr: ${stderr}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });

    // 4. Compilation succeeded, read the PDF file
    const pdfBuffer = await fs.promises.readFile(pdfFilePath);

    return { success: true, pdfBuffer };
  } catch (error) {
    // 5. Compilation failed. Try to extract the LaTeX log to help the user debug why
    console.error(`[LaTeX Compilation Error] Job ${jobId}:`, error.message);

    let logs = 'Unknown error occurred during compilation.';
    try {
      if (fs.existsSync(logFilePath)) {
        logs = await fs.promises.readFile(logFilePath, 'utf8');
      } else {
        logs = error.message;
      }
    } catch (logError) {
      console.error(`Could not read log file for job ${jobId}`, logError);
    }

    return { success: false, logs };
  } finally {
    // 6. ALWAYS clean up the temporary directory, whether success or failure
    try {
      if (fs.existsSync(workDir)) {
        await fs.promises.rm(workDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error(`[Cleanup Error] Failed to remove directory ${workDir}:`, cleanupError.message);
    }
  }
}

module.exports = {
  compileLatexToPdf,
};
