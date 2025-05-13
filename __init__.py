from .router import router
from .schemas.sponsors_component import SponsorsComponent
from services.component_registry import ComponentRegistry
import logging

logger = logging.getLogger("coffeebreak.core")

PLUGIN_TITLE = "sponsors-promotion-plugin"
NAME = "Sponsors Promotion Plugin"
DESCRIPTION = "A plugin to promote sponsors"

def register_plugin():
    ComponentRegistry.register_component(SponsorsComponent)
    logger.debug("Sponsors component registered.")
    return router

def unregister_plugin():
    ComponentRegistry.unregister_component("SponsorsComponent")
    logger.debug("Sponsors component unregistered.")

REGISTER = register_plugin
UNREGISTER = unregister_plugin

CONFIG_PAGE = True
