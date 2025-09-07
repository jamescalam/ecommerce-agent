import logging
import sys


class ColoredFormatter(logging.Formatter):
    """Custom colored formatter using ANSI escape codes."""
    
    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[1;31m', # Bold Red
    }
    RESET = '\033[0m'
    
    def __init__(self):
        super().__init__(
            "%(asctime)s %(levelname)s %(name)s %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    
    def format(self, record):
        # Only colorize if outputting to a terminal
        if sys.stderr.isatty():
            levelname = record.levelname
            if levelname in self.COLORS:
                record.levelname = f"{self.COLORS[levelname]}{levelname}{self.RESET}"
                record.msg = f"{self.COLORS[levelname]}{record.msg}{self.RESET}"
        
        result = super().format(record)
        
        # Reset the record to its original state
        record.levelname = record.levelname.replace(self.COLORS.get(record.levelname, ''), '').replace(self.RESET, '')
        
        return result


def add_coloured_handler(logger):
    formatter = ColoredFormatter()
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    return logger


def setup_custom_logger(name):
    logger = logging.getLogger(name)

    if not logger.hasHandlers():
        add_coloured_handler(logger)
        logger.setLevel(logging.INFO)
        logger.propagate = False

    return logger


logger: logging.Logger = setup_custom_logger(__name__)