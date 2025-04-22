if( window.driver && window.manualPage && window.manualPage.tour)
{ 
    const tourjs =  window.driver.js.driver()
    tourjs.setSteps(window.manualPage.tour)
    tourjs.drive() 
}
