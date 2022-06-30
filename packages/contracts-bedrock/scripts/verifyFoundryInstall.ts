import { sync as commandExistsSync } from 'command-exists'

if (!commandExistsSync('forge')) {
  
  process.exit(1)
}
