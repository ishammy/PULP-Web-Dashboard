import React, { useState, useRef, useEffect } from 'react';
import { usePulp } from '../../context/PulpContext';

export default function TerminalDrawer() {
  const { isTerminalOpen, toggleTerminal, telemetry, executeCommand } = usePulp();
  const [commandInput, setCommandInput] = useState('');
  const logsEndRef = useRef(null);
  const inputRef = useRef(null);

  const logs = telemetry.logs || [];

  useEffect(() => {
    if (isTerminalOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isTerminalOpen, logs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;
    executeCommand(cmd);
    setCommandInput('');
  };

  const handleChipClick = (cmd) => {
    executeCommand(cmd);
  };

  const quickChips = [
    { label: '/help', cmd: '/help' },
    { label: '/status', cmd: '/status' },
    { label: '/start', cmd: '/start' },
    { label: '/stop', cmd: '/stop' },
    { label: '/feed', cmd: '/feed' },
    { label: '/docs', cmd: '/docs' },
    { label: '/temp 48', cmd: '/temp 48' },
    { label: '/water 85', cmd: '/water 85' },
    { label: '/clear', cmd: '/clear' }
  ];

  return (
    <div
      className={`terminal-backdrop ${isTerminalOpen ? 'open' : ''}`}
      onClick={toggleTerminal}
      id="terminal-console-backdrop"
    >
      <div className="terminal-container" onClick={e => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="terminal-top-bar">
          <div className="terminal-dots">
            <span className="t-dot red" onClick={toggleTerminal} title="Close Console"></span>
            <span className="t-dot yellow"></span>
            <span className="t-dot green"></span>
          </div>
          <span className="terminal-title">pulp-edge-controller:~ /dev/ttyAMA0</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Type /help</span>
        </div>

        {/* Quick Command Action Chips for mobile thumb access */}
        <div className="terminal-chips-bar" aria-label="Quick Commands">
          {quickChips.map(c => (
            <button
              key={c.label}
              type="button"
              className="t-chip"
              onClick={() => handleChipClick(c.cmd)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Scrollable Logs Output */}
        <div className="terminal-logs-pane" id="terminal-logs-container">
          {logs.map((log, idx) => (
            <div key={idx} className={`log-entry ${log.level}`}>
              <span style={{ opacity: 0.6 }}>[{log.time_display}]</span> {log.message}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Command Input Bar */}
        <form className="terminal-input-bar" onSubmit={handleSubmit}>
          <span className="terminal-prompt-prefix">pulp&gt;</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            placeholder="Type command (/help, /status, /start, /stop, /temp 45...)"
            value={commandInput}
            onChange={e => setCommandInput(e.target.value)}
            autoComplete="off"
            spellCheck="false"
            id="terminal-prompt-input"
          />
          <button type="submit" className="terminal-send-btn" id="btn-terminal-send">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
