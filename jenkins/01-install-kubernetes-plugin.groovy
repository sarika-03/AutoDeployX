// Init script to ensure Kubernetes plugin is installed on Jenkins startup
import jenkins.model.Jenkins

def instance = Jenkins.getInstance()
def pm = instance.pluginManager
def uc = instance.updateCenter

def plugins = ['kubernetes']

plugins01-install-kubernetes-plugin.each { pluginId ->
    if (!pm.getPlugin(pluginId)) {
        println("Installing plugin: ${pluginId}")
        def plugin = uc.getPlugin(pluginId)
        if (plugin) {
            def installFuture = plugin.deploy()
            // wait up to 2 minutes for install
            installFuture.get(120, java.util.concurrent.TimeUnit.SECONDS)
            println("Installed plugin: ${pluginId}")
        } else {
            println("Plugin ${pluginId} not found in Update Center")
        }
    } else {
        println("Plugin already installed: ${pluginId}")
    }
}

instance.save()
