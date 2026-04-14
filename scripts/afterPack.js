const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

/**
 * afterPack hook that adds UTExportedTypeDeclarations to Info.plist.
 * This declares .har as a proper document type so macOS auto-generates
 * the document icon shape (page with folded corner) with our icon as
 * the badge, rather than using the raw icon file as the full file icon.
 */
exports.default = async function afterPack(context) {
  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename
  const plistPath = path.join(appOutDir, `${appName}.app`, 'Contents', 'Info.plist')

  if (!fs.existsSync(plistPath)) {
    console.log('afterPack: Info.plist not found, skipping UTI injection')
    return
  }

  console.log('Injecting UTExportedTypeDeclarations into Info.plist...')

  // Add the UTExportedTypeDeclarations array with our HAR file type
  const plistBuddy = '/usr/libexec/PlistBuddy'

  const cmds = [
    // Create the UTExportedTypeDeclarations array
    `-c "Add :UTExportedTypeDeclarations array"`,
    `-c "Add :UTExportedTypeDeclarations:0 dict"`,

    // UTI identifier
    `-c "Add :UTExportedTypeDeclarations:0:UTTypeIdentifier string com.netscope.har"`,

    // Human-readable description
    `-c "Add :UTExportedTypeDeclarations:0:UTTypeDescription string HAR File"`,

    // Icon file
    `-c "Add :UTExportedTypeDeclarations:0:UTTypeIconFile string har-icon.icns"`,

    // Conforms to public.data only — no public.json, because macOS
    // will show a JSON text preview instead of our icon if it thinks
    // the file is JSON.
    `-c "Add :UTExportedTypeDeclarations:0:UTTypeConformsTo array"`,
    `-c "Add :UTExportedTypeDeclarations:0:UTTypeConformsTo:0 string public.data"`,

    // Tag specification: file extension
    `-c "Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification dict"`,
    `-c "Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification:public.filename-extension array"`,
    `-c "Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification:public.filename-extension:0 string har"`,
  ]

  for (const cmd of cmds) {
    execSync(`${plistBuddy} ${cmd} "${plistPath}"`)
  }

  // Also update the CFBundleDocumentTypes to reference the UTI
  try {
    execSync(`${plistBuddy} -c "Add :CFBundleDocumentTypes:0:LSItemContentTypes array" "${plistPath}"`)
    execSync(`${plistBuddy} -c "Add :CFBundleDocumentTypes:0:LSItemContentTypes:0 string com.netscope.har" "${plistPath}"`)
  } catch {
    // LSItemContentTypes might already exist
  }

  console.log('UTI declaration injected successfully')
}
