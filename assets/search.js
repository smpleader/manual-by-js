function SearchForManual( mbjInstance, options = {}){
    if(Object.getPrototypeOf(mbjInstance) !== ManualByJs.prototype)
    {
        alert("Invalid MBJ instance")
        return false
    }

    this.version = '0.0.1'
    this.numberOfWord = 4
    this.minPageAllowCache = options.minPageAllowCache || 50
    this.maxPageAllowCache = options.maxPageAllowCache || 200
    this.ids = {
        input: "searcher-input",
        opt: "searcher-option",
        prg: "searcher-progress",
        res: "searcher-result",
    }

    this.manual = mbjInstance
    this.result = []

    if(options.ids) this.ids = {...this.ids, ...options.ids}

    this.sfm = {}
    
    for (let [key, id] of Object.entries(this.ids)) 
    {
        this.sfm[key] = document.getElementById(id)
    }

    this.hook = {
        afterSearching: null,
        onSearching: null
    }

    if(options.hook) this.hook = {...options.hook}

    this._init()
}

SearchForManual.prototype = {
    _getSurroundingWords: function(sentence, targetWord, numWords = this.numberOfWord) {
        const words = sentence.split(' ')
        const targetIndex = words.indexOf(targetWord.replace(/[^a-zA-Z0-9]/g, ''))
    
        if (targetIndex === -1) {
            return ""
        }
    
        const start = Math.max(0, targetIndex - numWords);
        const end = Math.min(words.length, targetIndex + numWords + 1)
        
        words[targetIndex] =  "<strong>" + words[targetIndex] + "</strong>"
        const surroundingWords = words.slice(start, end)
        return surroundingWords.join(' ')
    },
    _search:  async function(txt)
    { // todo cache the data: compare  this.manual.menu.length
        this.result = [] 
        let  i = 0, regex = new RegExp(txt, "i"), idxSearch, page
        //txt.replace(/[^a-zA-Z0-9 ]/g, '')) --> filter for options

        while( i < this.manual.menu.length)
        { 
            page = this.manual.menu[i]
            i++ 
            if(page.slug)
            {
                content = await this.manual.digContent(page)
                noHTML = content.replace(/(<([^>]+)>)/ig, '')
                idxSearch = regex.exec(noHTML) 
                
                if( idxSearch !== null)
                {
                    page.link = this.manual.prefix + page.slug
                    page.found = this._getSurroundingWords(noHTML, txt) 
                    this.result.push(page)
                }
                this._onSearching(page, i, idxSearch)
            }
        }
        this._afterSearching()
    },
    _afterSearching: function() {
        if(this.hook.afterSearching instanceof Function)
        {
            this.hook.afterSearching()
            return
        }    
        this.sfm.prg.innerHTML = this.result.length +" found"
        if(this.result.length)
        {
            
            this.sfm.res.innerHTML = "A list show here"  
        }
        else
        {
            this.sfm.res.innerHTML = ""
        }
    },
    _onSearching: function(page = null, i = 0, found = 0)
    {
        if(this.hook.onSearching instanceof Function)
        {
            this.hook.onSearching(i, page, found)
            return
        }

        this.sfm.prg.innerHTML = i ? "<i>searching " + i + "/" + this.manual.menu.length + "</i>" : "<i>wait for your input</i>"       
    },
    clear: function()
    {
        this.sfm.res.innerHTML = ""
        this.sfm.prg.innerHTML = ""
        this.sfm.input.value = ""
    },
    _init: async function()
    {
        if(this.sfm.input)
        {
            let delaySearch
            this.sfm.input.addEventListener('keyup', () => { 
                this._onSearching(0)
                clearTimeout(delaySearch)
                if(this.sfm.input.value.length > 2)
                {
                    delaySearch = setTimeout(() => {
                        this._search( this.sfm.input.value); 
                    }, 1000)
                     
                }
            })
        }
    }
}