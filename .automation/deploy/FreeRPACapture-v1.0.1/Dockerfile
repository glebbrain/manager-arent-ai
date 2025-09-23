FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Install Visual C++ Redistributable
ADD https://aka.ms/vs/17/release/vc_redist.x64.exe C:/temp/vc_redist.x64.exe
RUN C:/temp/vc_redist.x64.exe /quiet /install

# Copy application
COPY . C:/freerpacapture/

# Set working directory
WORKDIR C:/freerpacapture

# Expose port for HTTP API
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD freerpacapture.exe version || exit 1

# Entry point
ENTRYPOINT ["freerpacapture.exe"]
