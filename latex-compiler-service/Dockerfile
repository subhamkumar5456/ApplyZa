FROM node:20-slim

# Install TeX Live and related necessary packages
# We use --no-install-recommends to keep the image as small as possible
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    wget \
    fontconfig \
    # We install some curl/ca-certificates if we'd need to fetch fonts later
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Add a non-root user for security (optional but recommended)
RUN useradd -m appuser

# Set working directory
WORKDIR /usr/src/app

# Copy package.json to leverage Docker cache
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create a temporary directory that the application can write to
# We give ownership to the appuser
RUN mkdir -p /usr/src/app/tmp && chown -R appuser:appuser /usr/src/app/tmp

# Switch to the non-root user
USER appuser

# Expose port
EXPOSE 3001

# Command to begin
CMD ["node", "src/index.js"]
