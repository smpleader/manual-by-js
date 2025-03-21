function ManualByJs(options = {}){
    this.version = '0.1.7'
    this.flag = options.flag || ''
    this.folderContent = options.folderContent || 'content'
    this.siteTitle = options.siteTitle || 'Manual By JS'
    this.homePage = options.homePage || 'home'
    this.current = {}
    this.next = {}
    this.prev = {}
    this.menu = options.menu || []
    this.milestone = options.milestone || []
    this.fileExt = options.fileExt ?? "html"

    this.md = options.md || null
    
    this.ids = {
        siteTitle: "mbj-site-title",
        milestone: "mbj-milestone",
        milestoneMenu: "mbj-milestone-menu",
        menu: "mbj-menu",
        page: "mbj-page",
        pageNav: "mbj-page-nav",
        pageIndex: "mbj-page-index"
    }

    if(options.ids) this.ids = {...options.ids}

    this.mbj = {}
    
    for (let [key, id] of Object.entries(this.ids)) 
    {
        this.mbj[key] = document.getElementById(id)
    }

    this.markdown = options.markdown || null

    this._init()
}

ManualByJs.prototype = {
    read: async function(page_link){
        
        let content = await fetch(page_link)
        .then(response => response.text()) 
        .catch(error => {
            alert('Can not get page content '+ page_link )
            console.error('Error fetching the file  page', error);
        })

        if(this.markdown && this.current.fileExt == "md")
        {
            content = this.md(content)
        }

        return content
    },
    findPageByIndex: function(idx, step)
    {
        finder = idx + step
        if(finder < 0 || finder == this.menu.length ) return false
        test = this.menu[finder]
        return test.slug ?  test : this.findPageByIndex(finder, step)
    },
    findPageByHash: function(hash)
    {
        for(var ind = 0; ind < this.menu.length; ind++)
        {
            item = this.menu[ind]
            if( (item.slug && hash == item.slug) || 
                (item.index && item.index.includes(hash)) )
            { 
                item.ordering = ind
                return item
            }
        }
        return false
    },
    _createSidebarMenu: function() {
        if(this.mbj.menu)
        {
            for(const item of this.menu)
            {
                var line = item.slug ? 
                    '<a href="#'+ item.slug +'" class="'+ item.slug +'">'+ item.title +'</a>' :
                    ( item.href ? 
                        '<a href="'+ item.href +'" class="hover link" '+ (item.target?'target="'+item.target+'">':'>') + item.title +'</a>' :
                        '<h6><strong>'+ item.title+'</strong></h6>'
                    )
                    
                this.mbj.menu.insertAdjacentHTML("beforeend", line)
            }
        }
        else 
        {
            console.log("No element to keep Sidebar menu!")
        }
    },
    _createIndexTable: function()  {
        if(this.mbj.pageIndex)
        {
            this.mbj.pageIndex.innerHTML = ""
            if(this.current.index)
            { 
                this.mbj.pageIndex.insertAdjacentHTML("beforeend", '<li class="mt-3"><b>On this page</b></li>')
                for(const item of this.current.index)
                {
                    if(typeof item == "string")
                    {
                        let name = item.charAt(0).toUpperCase() + item.slice(1);
                        name = name.replace(/-|_/g, " ")
                        this.mbj.pageIndex.insertAdjacentHTML("beforeend", '<li><a class="item" href="#'+item+'">'+name+'</a></li>')

                    }
                    else if( item.id && item.name)
                    {
                        this.mbj.pageIndex.insertAdjacentHTML("beforeend", '<li><a class="item" href="#'+item.id+'">'+item.name+'</a></li>')
                    }
                }
            }
        }
        else
        {
            // this element is optional
        } 
    },
    _updateWindowTitle: function(line)
    {
        document.title = line
    },
    _sidebarMenuActivate: function(slug)
    {   
        const anchors = this.mbj.menu.getElementsByTagName('a');
        for(const m of anchors)
        {
            if(m.classList.contains(slug))
            {
                m.classList.add("active")
            }
            else
            {
                m.classList.remove("active")
            }
        }
    },
    _footMenuActivate: function(ordering)
    {
        if(this.mbj.pageNav)
        {
            this.mbj.pageNav.innerHTML = ""
            this.prev = this.findPageByIndex(ordering, -1)
            if(false == this.prev)
            {
                this.mbj.pageNav.insertAdjacentHTML("afterbegin", '<a class="invisible"><span>.</span></a>')
            } 
            else 
            {
                this.mbj.pageNav.insertAdjacentHTML("afterbegin", 
                    '<a href="#'+this.prev.slug+'" class="">' +
                        '<span>Previous page</span>' +
                        this.prev.title +
                    '</a>');
            }
    
            this.next = this.findPageByIndex(ordering, 1)
    
            if(false !==  this.next)
            {
                this.mbj.pageNav.insertAdjacentHTML("beforeend", 
                    '<a href="#'+this.next.slug+'" class="text-end">' +
                        '<span>Next page</span>' +
                        this.next.title +
                    '</a>');
            } 
        }
        else
        {
            // this element is optional
        } 
    },
    _setSiteTitle: function()
    {
        this.mbj.siteTitle.innerText = this.siteTitle
    },
    _createMilestoneMenu: function()
    {
        if(this.milestone.length > 0 && this.mbj.milestone)
        {
            this.mbj.milestone.innerHTML = ''
            for(const item of this.milestone)
            {
                this.mbj.milestone.insertAdjacentHTML("beforeend", 
                    '<li><a class="dropdown-item" href="' + item.href + '">'+ item.title +'</a></li>' )
            }
            
            this.mbj.milestoneMenu.innerHTML =  this.milestone[0].title
        }
    },
    navigate: async function(hash){
        let item = this.findPageByHash(hash)
        if(item)
        {
            this.current = item

            let content = '', ext = item.fileExt??this.fileExt

            if(!this.current.fileExt) this.current.fileExt = ext

           
            if(item.parts)
            {
                for(const part of item.parts)
                {
                    link =  this.folderContent + '/' + part + '.' + ext
                    content += await this.read(link)
                }
            }
            else
            {
                link =  this.folderContent + '/' + (item.alias ?? item.slug) + '.' + ext
                content = await this.read(link)
            }

            if( true !== content)
            {
                this.mbj.page.innerHTML = ""
                this.mbj.page.insertAdjacentHTML("afterbegin", content)
            }

            this._sidebarMenuActivate(item.slug)
            this._updateWindowTitle(this.siteTitle + " - " + this.current.title)
            this._createIndexTable()
            this._footMenuActivate(item.ordering)

            // if item found by index, we won't scroll it
            if(item.slug === hash)
            {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        }
    }, 
    _init: async function(){ 

        if(this.menu.length == 0)
        {    
            this.menu = await fetch(this.folderContent + '/menu.json')
            .then(response => response.text())
            .then(data => JSON.parse(data))
            .catch(error => {
                alert('Can not create menu!')
                console.error('Error fetching the file  menu', error);
            });
        }
            
        let hash = window.location.hash.substring(1);
        if(hash.length == 0) hash = this.homePage
        
        await this.navigate( hash )

        this._createSidebarMenu() 
        this._setSiteTitle()
        this._createMilestoneMenu()

        // global event
        that = this
    
        window.addEventListener('hashchange', function() {
            const hash = window.location.hash.substring(1); // Remove the '#' character
            that.navigate(hash);
        });
    }
}