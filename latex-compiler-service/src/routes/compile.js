const express = require('express');
const { compileLatexToPdf } = require('../services/latex');

const router = express.Router();

/**
 * POST /compile
 * Accepts a JSON body with the shape: { "latexCode": "\\documentclass{article}..." }
 * Returns the PDF file as a buffer, or a JSON error containing the log output.
 */
router.post('/', async (req, res, next) => {
  try {
    const { latexCode } = req.body;

    if (!latexCode || typeof latexCode !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "latexCode" in the request body.' });
    }

    // Call the heavy compilation service
    const result = await compileLatexToPdf(latexCode);

    if (result.success) {
      // Send the resulting PDF buffer
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
      res.setHeader('Content-Length', result.pdfBuffer.length);
      return res.status(200).send(result.pdfBuffer);
    } else {
      // Compilation failed, send back the logs
      return res.status(422).json({
        error: 'LaTeX compilation failed.',
        logs: result.logs,
      });
    }
  } catch (error) {
    // Pass unexpected errors to the global error handler
    next(error);
  }
});

module.exports = router;
